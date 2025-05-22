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

let m_main_swiper = null;

function setInit() {
    m_main_swiper = new Swiper('.main_list', {
        spaceBetween: 0, //슬라이드 간격
        speed: 700,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        },
        on: {
            slideChange: function () {},
            init: function () {},
        },
    });


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
        if ($(".screen_page").css("display") == "none") {
            setStartTopTextAnimation();
        }
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

    $('#id_main_list_wrapper').html("");
    let t_max = 12;
    let t_html = "";
    let r_html = "";
    let page_cnt = Math.ceil(m_contents_list.length / t_max);
    for (let i = 0; i < page_cnt; i += 1) {
        t_html += "<div id='id_main_list_slide_" + i + "' class='swiper-slide item_list'>";
        t_html += "    <ul id='id_main_list_wrap_" + i + "' class='swiper-slide-container item_wrap'>";
        t_html += "    </ul>";
        t_html += "</div>";
    }
    $('#id_main_list_wrapper').append(t_html);

    for (let i = 0; i < m_contents_list.length; i += 1) {
        let t_obj = m_contents_list[i];
        let t_id = Math.floor(i / t_max);
        r_html += "<li class='item' onClick='javascript:onClickItem(" + i + ");'>";
        r_html += "     <div class='img_zone'>";
        r_html += "          <img src='" + convFilePath(t_obj.THUM_URL) + "'>";
        r_html += "     </div>";
        r_html += "     <div class='txt_zone'>";
        r_html += "          <p><span>" + convStr(t_obj.CONTENTS_NAME) + "</span></p>";
        r_html += "     </div>";
        r_html += "</li>";

        $('#id_main_list_wrap_' + t_id).append(r_html);
        r_html = "";
    }



    m_main_swiper.update(); // 스와이퍼 업데이트
    m_main_swiper.slideTo(0, 0);

    setTimeout(function () {
        setHideCover();
    }, 500);
}

function onClickItem(_num) {
    //console.log(_num);
    $(".btn_play").show();
    $(".btn_stop").hide();
    m_curr_obj = m_contents_list[_num];
    $(".txt_title").html(m_curr_obj.CONTENTS_NAME);
    setTimeout(adjustFontSize, 50);
    $(".txt_desc").html("재생 버튼을 누르시면 영상이 재생됩니다");
    $(".control_area").fadeIn();
}

function onClickBtnStop(_obj) {
    //console.log(m_curr_obj);
    $(".btn_play").show();
    $(".btn_stop").hide();
    $(".txt_desc").html("재생 버튼을 누르시면 영상이 재생됩니다");
    
    setCallWebToApp('UDP_SEND', "STOP|"+m_curr_obj.ID);
}

function onClickBtnPlay(_obj) {
    //console.log(m_curr_obj);
    $(".btn_play").hide();
    $(".btn_stop").show();
    $(".txt_desc").html("재생중입니다");
    
    setCallWebToApp('UDP_SEND', "PLAY|"+m_curr_obj.ID);
}

function onClickBtnClose(_obj) {
    //console.log(m_curr_obj);
    if ($(".btn_stop").css("display") != "none") {
        setCallWebToApp('UDP_SEND', "STOP|"+m_curr_obj.ID);
    }
    $(".txt_desc").html("&nbsp;");
    $(".control_area").fadeOut();
    m_curr_obj = null;
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

function setCommand(_data) {
    console.log("setCommand", _data);
    const parts = _data.trim().split('|');
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
    
    $(".img_char").removeClass("pause");
    
    setStartTopTextAnimation();
}

function setStartTopTextAnimation(){
    $(".txt_small").css("opacity","0");
    setTextTypeAnimation(".txt_big", "Daejeon<br>Media Art", 0.075);
}

function adjustFontSize() {
    $(".txt_title").css("font-size", m_default_font_size + "px");
    let $parent = $(".txt_title").parent(); // 부모 요소
    let parentWidth = $parent.width(); // 부모 너비
    let textWidth = $(".txt_title").outerWidth(); // 현재 텍스트 너비
    let fontSize = m_default_font_size; // 초기 폰트 크기

    // 부모 너비를 초과하면 폰트 크기 줄이기
    //    console.log(textWidth); 
    //console.log(textWidth, parentWidth, fontSize);
    while (textWidth > parentWidth && fontSize > 10) {
        fontSize -= 2;
        $(".txt_title").css("font-size", fontSize + "px");
        textWidth = $(".txt_title").outerWidth();
    }
}

function setTextTypeAnimation(target_selector, text, speed = 0.1) {
    const $target = $(target_selector);
    $target.empty();

    // 문자열에서 <br>은 태그로 인식되게 split 처리
    const parts = text.split(/(<br\s*\/?>)/i); // <br>, <br/>, <br /> 모두 처리
    let html = "";

    parts.forEach(part => {
        if (part.toLowerCase().startsWith("<br")) {
            html += part; // br은 span으로 감싸지 않고 그대로 삽입
        } else {
            html += part
                .split("")
                .map(char => `<span style="opacity:0;">${char}</span>`)
                .join("");
        }
    });

    $target.html(html);

    // 타이핑 애니메이션
    gsap.to(`${target_selector} span`, {
        opacity: 1,
        duration: 0.3,
        stagger: speed,
        ease: "power1.inOut",
        onComplete: () => {
            onTypeAnimationComp(); // 애니메이션 끝나면 실행
        }
    });
}

function onTypeAnimationComp(){
    
    gsap.to($(".txt_small"), {
        startAt: {
            y: 20
        },
        opacity: 1,
        duration: 0.75,
        ease: "power1.out",
        y: 0
    });
}

function convStr(_str) {
    if (_str == null) {
        return "";
    } else {
        return _str.replace(/(\r\n|\n\r|\n|\r)/g, '<br>');
    }
}
