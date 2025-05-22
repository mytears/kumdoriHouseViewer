let m_status_time_chk = 0;
let m_text_ani_chk = 0;
let m_time_last = 0;
let m_contents_url = "";
let m_root_url = "";
let m_notice_mode = "";
let setTimeoutID = null;
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

    $(".btn_play").on("touchstart mousedown", function (e) {
        e.preventDefault();
        onClickBtnPlay(this);
    });

    $(".btn_stop").on("touchstart mousedown", function (e) {
        e.preventDefault();
        onClickBtnStop(this);
    });

    $(".btn_close").on("touchstart mousedown", function (e) {
        e.preventDefault();
        onClickBtnClose(this);
    });

    $('.screen_page').on("touchstart mousedown", function (e) {
        e.preventDefault();
        onClickScreenSaver();
    });

    $("html").on("touchstart mousedown", function (e) {
        e.preventDefault();
        setTouched();
    });

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
        m_time_last = new Date().getTime();
        setMainReset();
    }

    m_status_time_chk += 1;
    if (m_status_time_chk > 10) {
        m_status_time_chk = 0;
        setCallWebToApp('STATUS', 'STATUS');
    }
}

function setTouched() {
    m_time_last = new Date().getTime();
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
    //console.log(m_notice_list);
    //console.log(m_contents_list);

    setNoticeDrawInfo();

    setTimeout(function () {
        setHideCover();
    }, 500);
}


function setMainReset() {
    console.log("setMainReset");
    $(".img_char").addClass("pause");
    setScreenAuto();
    m_main_swiper.slideTo(0, 0);
    m_curr_obj = null;
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
    let arg = t_list[1];
    if (cmd.toUpperCase() == "PLAY") {

    } else if (cmd.toUpperCase() == "STOP") {

    }
}

function setScreenAuto() {
    if ($(".screen_page").css("display") == "none") {
        clearTimeout(setTimeoutID);
        setNoticeDrawInfo();
        $(".screen_page").show();
    }
}

function setNoticeDrawInfo() {
    var str_type = "";
    var str_show = "",
        str_hide = "";
    if (m_notice_list.length == 0) return;

    m_curr_notice_cnt++;
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

    if (obj.TYPE == "IMG") {
        $("#" + str_show + " > img").attr("src", m_root_url + obj.FILE_URL);
        $("#" + str_show + " > video").hide();
        $("#" + str_show).children("video")[0].pause();
        $("#" + str_show + " > img").show();
    } else {
        $("#" + str_show + " > video").attr("src", m_root_url + obj.FILE_URL);
        $("#" + str_show + " > video").show();
        $("#" + str_show + " > img").hide();
        $("#" + str_show).children("video")[0].play();
    }
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

function setAdminVideoPlay(_code) {
    m_curr_obj = m_contents_list[parseInt(_code)];
    $("#id_main_video").hide();
    $("#id_main_image").hide();
    if (m_curr_obj.TYPE == "MOV") {
        $("#id_main_video").show();
        $("#id_main_video").attr('src', convFilePath(m_curr_obj.FILE_URL));
        $(".video_main").fadeIn();
    }
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
        $("#id_screen_area_01").children("video")[0].pause();
    } catch (err) {}
    try {
        $("#id_screen_area_02").children("video")[0].pause();
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
