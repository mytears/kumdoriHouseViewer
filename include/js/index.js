let m_status_time_chk = 0;
let m_text_ani_chk = 0;
let m_time_last = 0;
let m_contents_url = "";
let m_root_url = "";
let m_notice_mode = "";
let setTimeoutID = null;
let setTimeoutVideoID = null;
let setAnimationTimeoutID = null;

let m_xml_data = new Object();
let m_header = new Object();
let m_notice_list = [];
let m_contents_list = [];

let m_curr_notice = 1;
let m_curr_notice_ptime = 0;
let m_curr_notice_type = "";
let m_curr_notice_cnt = -1;
let m_notice_timeout = null;
let m_default_font_size = 90;
let m_curr_obj = null;


function setInit() {
    m_time_last = new Date().getTime();
    setInterval(setMainInterval, 1000);
    setLoadSetting("include/setting.json");
    setInitFsCommand();
}


//메인 타이머
function setMainInterval() {
    var time_gap = 0;
    var time_curr = new Date().getTime();

    time_gap = time_curr - m_time_last;
    time_gap = Math.floor(time_gap / 1000);

    if (time_gap >= 180) {
        //m_time_last = new Date().getTime();
        //setMainReset();
    }

    m_status_time_chk += 1;
    if (m_status_time_chk > 60) {
        m_status_time_chk = 0;
        setCallWebToApp('STATUS', 'STATUS');
    }
}

function setLoadSetting(_url) {
    $.ajax({
        url: _url,
        dataType: 'json',
        success: function (data) {
            m_contents_url = data.setting.content_url;
            m_root_url = data.setting.root_url;
            m_notice_mode = data.notice_mode;
            setContents();
        },
        error: function (xhr, status, error) {
            console.error('컨텐츠 에러 발생:', status, error);
        },
    });
}

//kiosk_contents를 읽기
function setContents() {
    setLoadDataContentsXml(m_contents_url);
}

//로딩 커버 가리기
function setHideCover() {
    if ($(".cover").css("display") != "none") {
        $('.cover').hide();
    }
}

//초기화
function setInitSetting(_ret_code) {

    setNoticeDrawInfo();

    setTimeout(function () {
        setHideCover();
    }, 500);
}


function setMainReset() {
    console.log("setMainReset");
    setScreenAuto();
    m_curr_obj = null;
    setMainVideoStop();
}

function setInitFsCommand() {
    if (window.chrome.webview) {
        window.chrome.webview.addEventListener('message', (arg) => {
            console.log(arg.data);
            setCommand(arg.data);
        });
    }
}

function setCommand(_str) {
    console.log("setCommand", _str);
    let t_list = _str.split("|");
    let cmd = t_list[0];
    let mod = t_list[1];
    let arg = t_list[2];
    let t_arg_list = arg.split(",");

    if (mod.toUpperCase() == "KIOSK" && cmd.toUpperCase() == "UDP_RECV") {
        //UDP_RECV|KIOSK|PLAY,1
        if (t_arg_list[0] == "PLAY") {
            setMainVideoPlay(t_arg_list[1]);
        } else if (t_arg_list[0] == "STOP") {
            setMainVideoStop();
        } else if (t_arg_list[0] == "RESET") {
            setMainReset();
        }
    }
}

function setScreenAuto() {
    console.log($(".screen_page").css("display"));
    if ($(".screen_page").css("display") == "none") {
        clearTimeout(setTimeoutID);
        setNoticeDrawInfo();
        $(".screen_page").show();
        $(".video_main").fadeOut();
    }
}

function setNoticeDrawInfo() {
    var str_type = "";
    var str_show = "",
        str_hide = "";
    if (m_notice_list.length == 0) return;

    m_curr_notice_cnt++;
    //console.log(m_curr_notice_cnt, m_notice_list.length, m_curr_notice)
    if (m_curr_notice_cnt >= m_notice_list.length) m_curr_notice_cnt = 0;

    var obj = m_notice_list[m_curr_notice_cnt];

    if (m_curr_notice == 1) {
        m_curr_notice = 2;

        str_show = "id_notice_box_02";
        str_hide = "id_notice_box_01";

        $("#id_notice_box_01").css("zIndex", 10);
        $("#id_notice_box_02").css("zIndex", 9);
    } else {
        m_curr_notice = 1;

        str_show = "id_notice_box_01";
        str_hide = "id_notice_box_02";

        $("#id_notice_box_01").css("zIndex", 10);
        $("#id_notice_box_02").css("zIndex", 9);
    }
    //console.log(str_show);

    if (obj.TYPE == "IMG") {
        $("#" + str_show + " > img").attr("src", m_root_url + obj.FILE_URL);
        if (obj.RATIO == "F") {
            $("#" + str_show + " > img").addClass("full_size");
        } else if (obj.RATIO == "R") {
            $("#" + str_show + " > img").removeClass("full_size");
        }
        $("#" + str_show + " > video").hide();
        $("#" + str_show).children("video")[0].pause();
        $("#" + str_show + " > img").show();
    } else {
        if (obj.RATIO == "F") {
            $("#" + str_show + " > video").addClass("full_size");
        } else if (obj.RATIO == "R") {
            $("#" + str_show + " > video").removeClass("full_size");
        }
        
        $("#" + str_show + " > video").attr("src", m_root_url + obj.FILE_URL);
        $("#" + str_show + " > video").show();
        $("#" + str_show + " > img").hide();
        //$("#" + str_show).children("video")[0].play();
        let video_id = $("#" + str_show + " > video").attr("id");
        setCallWebToApp("UNMUTE", video_id);
        /*
        var $video = $("#" + str_show + " > video");
        var video_el = $video[0]; // native DOM element
        var video_url = m_root_url + obj.FILE_URL;

        // 기존 <source> 태그 제거 및 재설정 (보다 확실한 방식)
        $video.empty();
        $video.append($("<source>", {
            src: video_url,
            type: "video/mp4"
        }));
        $video.show();
        $("#" + str_show + " > img").hide();

        // 비디오 상태 로그 및 오류 추적용 이벤트 바인딩
        $video.off("error canplay waiting stalled pause play ended");
        $video.on("error", function (e) {
            const err = this.error;
            console.error("🚫 비디오 재생 오류!", err);
        });
        $video.on("waiting", () => console.warn("⏳ 버퍼링 중..."));
        $video.on("stalled", () => console.warn("⚠️ 재생 정지 (stalled)..."));
        $video.on("canplay", function () {
            console.log("✅ 재생 가능 상태!");
            video_el.play().catch(err => console.error("🎬 play() 실패", err));
        });
        $video.on("ended", () => console.log("🏁 영상 끝남"));
        $video.on("pause", () => console.log("⏸️ 일시정지됨"));
        $video.on("play", () => console.log("▶️ 재생 시작"));

        video_el.load(); // src가 바뀌었기 때문에 load() 반드시 호출
        */
    }

    /*
    var $video = $("#" + str_show + " > video");

    // 상태 확인을 위한 이벤트들
    $video.on("loadedmetadata", function () {
        console.log("메타데이터 로드 완료 (duration, video size 등)");
    });

    $video.on("play", function () {
        console.log("비디오 재생 시작");
    });

    $video.on("pause", function () {
        console.log("비디오 일시 정지");
    });

    $video.on("ended", function () {
        console.log("비디오 재생 종료");
    });

    $video.on("timeupdate", function () {
        console.log("현재 재생 위치:", this.currentTime);
    });

    $video.on("seeking", function () {
        console.log("탐색 중...");
    });

    $video.on("seeked", function () {
        console.log("탐색 완료");
    });

    $video.on("waiting", function () {
        console.log("버퍼링 중...");
    });

    $video.on("canplay", function () {
        console.log("재생 가능한 상태");
    });

    $video.on("error", function(e) {
        const error = this.error;
        let message = "알 수 없는 오류";

        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    message = "사용자가 비디오 재생을 중단함.";
                    break;
                case error.MEDIA_ERR_NETWORK:
                    message = "네트워크 오류로 인해 다운로드 실패.";
                    break;
                case error.MEDIA_ERR_DECODE:
                    message = "비디오 디코딩 중 오류 발생.";
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    message = "지원하지 않는 포맷 또는 파일을 찾을 수 없음.";
                    break;
            }
        }

        console.error("비디오 오류:", message, error);
    });

    */


    //console.log(str_show);
    m_curr_notice_type = obj.TYPE;
    m_curr_notice_ptime = obj.PTIME;
    if (m_curr_notice_ptime < 5) m_curr_notice_ptime = 5;
    m_curr_notice_ptime = m_curr_notice_ptime * 1000;
    clearTimeout(setTimeoutID);
    setTimeoutID = setTimeout(setMainTimeOut, m_curr_notice_ptime);
    setTimeout(setNoticeDrawInfoEnd, 10);
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function setNoticeDrawInfoEnd() {
    if (m_notice_list.length == 1) {
        if (m_curr_notice == 1) {
            $("#id_notice_box_01").show();
            $("#id_notice_box_02").hide();
        } else {
            $("#id_notice_box_01").hide();
            $("#id_notice_box_02").show();
        }
    } else {
        if (m_curr_notice == 1) {
            $("#id_notice_box_01").show();
            $("#id_notice_box_02").hide();
        } else {
            $("#id_notice_box_01").hide();
            $("#id_notice_box_02").show();
        }
    }
}

function setMainVideoPlay(_code) {
    console.log("setMainVideoPlay", _code);
    m_curr_obj = null;
    for (var i = 0; i < m_contents_list.length; i += 1) {
        if (_code == m_contents_list[i].ID) {
            m_curr_obj = m_contents_list[i];
        }
    }
    if (m_curr_obj == null) {
        setCallWebToApp("SET_LOG", "컨텐츠가 존재하지 않습니다. > ID : " + _code);
        return;
    }

    onClickScreenSaver();

    console.log("m_curr_obj", m_curr_obj);
    $("#id_main_video").hide();
    $("#id_main_image").hide();
    if (m_curr_obj.TYPE == "MOV") {
        $("#id_main_video").show();
        if (m_curr_obj.RATIO == "F") {
            $("#id_main_video").addClass("full_size");
        } else if (m_curr_obj.RATIO == "R") {
            $("#id_main_video").removeClass("full_size");
        }
        $("#id_main_video").attr("src", convFilePath(m_curr_obj.FILE_URL));        
        let video_id = "id_main_video";
        setCallWebToApp("UNMUTE", video_id);
    } else if (m_curr_obj.TYPE == "IMG") {
        $("#id_main_image").show();
        $("#id_main_image").attr("src", convFilePath(m_curr_obj.FILE_URL));
    }
    $(".video_main").fadeIn();

    m_curr_video_ptime = parseFloat(m_curr_obj.PTIME) * 1000;
    clearTimeout(setTimeoutVideoID);
    setTimeoutVideoID = setTimeout(setVideoTimeOut, m_curr_video_ptime);
}

function setVideoTimeOut() {
    setCallWebToApp("UDP_SEND", "WALL|STOP,0");
}

function setMainVideoStop() {
    console.log("setMainVideoStop");
    $("#id_main_video")[0].pause();
}

function setMainTimeOut() {
    if ($("#id_page_notice_list").css("display") == "none") {
        return;
    } else {
        setNoticeDrawInfo();
    }
}

function onClickScreenSaver() {
    if ($(".screen_page").css("display") == "none") {
        return;
    }
    try {
        $("#id_notice_box_01").children("video")[0].pause();
    } catch (err) {}
    try {
        $("#id_notice_box_02").children("video")[0].pause();
    } catch (err) {}
    $(".screen_page").fadeOut();
    clearTimeout(setTimeoutID);

}

function convStr(_str) {
    if (_str == null) {
        return "";
    } else {
        return _str.replace(/(\r\n|\n\r|\n|\r)/g, '<br>');
    }
}
