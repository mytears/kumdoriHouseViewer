let m_status_time_chk = 0;
let m_time_last = 0;
let m_contents_url = "";
let m_root_url = "";
let m_notice_mode = "";
let m_notice_list = [];
let m_main_video_list = [];
let m_admin_video_list = [];

let m_curr_notice = 1;
let m_curr_notice_ptime = 0;
let m_curr_notice_type = "";
let m_curr_notice_cnt = -1;
let m_notice_timeout = null;
let m_admin_timeout;
let m_curr_video_zone = null;
let m_showInnerTimer;
let m_logo_url = "";
let m_curr_admin = 1;

let m_pos_list = [
    {
        x: 0,
        y: 0
    },
    {
        x: 696,
        y: 0
    },
    {
        x: 1392,
        y: 0
    },
    {
        x: 0,
        y: 564
    },
    {
        x: 1392,
        y: 564
    },
    {
        x: 696,
        y: 564
    }
];

function setInit() {
    m_time_last = new Date().getTime();
    setInterval(setMainInterval, 1000);
    setLoadSetting("include/setting.json");
    setInitFsCommand();
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

//메인 타이머
function setMainInterval() {
    var time_gap = 0;
    var time_curr = new Date().getTime();

    time_gap = time_curr - m_time_last;
    time_gap = Math.floor(time_gap / 1000);
    if (time_gap > 180) {
        //setMainReset();
    }

    m_status_time_chk += 1;
    if (m_status_time_chk > 60) {
        m_status_time_chk = 0;
        setCallWebToApp('STATUS', 'STATUS');
    }
}

//로딩 커버 가리기
function setHideCover() {
    if ($(".cover").css("display") != "none") {
        $('.cover').hide();
    }
}

//초기화
function setInitSetting() {
    if (m_main_video_list.length > 0) {
        let t_video_zone = null;
        let t_video = null;
        let t_img = null;
        let t_obj = null;
        
        for (var i = 0; i < 5; i += 1) {
            //console.log(">>>>>>> " + i + " <<<<<<<<<<");
            t_obj = getVideoCode(i);
            t_video = $(".video_page .video_zone[code='" + i + "'] video");
            t_video_zone = $(".video_page .video_zone[code='" + i + "']");
            t_img = $(".video_page .video_zone[code='" + i + "'] img");
            t_video_zone.attr("type", t_obj.type);
            
            if(t_obj.type=="MOV"){
                t_video.prop('preload', false);
                t_video.prop('autoplay', false);
                t_video.attr('src', convFilePath(t_obj.file_url));
            }else{
                t_video.hide();
            }
            
            t_img.attr('src', convFilePath(t_obj.thum_url));
            t_video_zone.css("top", m_pos_list[i].y);
            t_video_zone.css("left", m_pos_list[i].x);
            t_video_zone.css("width", 688);
            t_video_zone.css("height", 556);
        }
        $(".video_page .image_zone[code='5']").css("top", m_pos_list[5].y);
        $(".video_page .image_zone[code='5']").css("left", m_pos_list[5].x);
    }

    if (m_notice_list.length > 0) {
        const date = new Date();
        const i_date = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

        m_final_notice_list = m_notice_list.filter(item => {
            const i_sday = parseInt(item.sday);
            const i_eday = parseInt(item.eday);
            return i_sday <= i_date && i_eday >= i_date;
        });
        m_notice_list = m_final_notice_list;
        setNoticeDrawInfo();
    } else {
        $(".notice_main").hide();
    }
    $(".video_page .image_zone img").attr('src', convFilePath(m_logo_url));
}

function getAdminVideoCode(_code) {
    for (var i = 0; i < m_admin_video_list.length; i += 1) {
        if (_code.toString() == m_admin_video_list[i].code.toString()) {
            return m_admin_video_list[i];
        }
    }
}

function getVideoCode(_code) {
    for (var i = 0; i < m_main_video_list.length; i += 1) {
        if (_code.toString() == m_main_video_list[i].code.toString()) {
            return m_main_video_list[i];
        }
    }
}

function setMainReset() {
    console.log("setMainReset");
    m_curr_video_zone = null;
    $(".video_page").hide();
    $(".admin_video_page").hide();
    setAllVideoMute();
    setAllVideoPause();
    setAllVideoClear();
    $('#id_notice_box_01 > video').hide();
    $('#id_notice_box_01 > img').hide();
    $('#id_notice_box_02 > video').hide();
    $('#id_notice_box_02 > img').hide();
    setAllVideoPositionReset();
    setNoticeDrawInfo();
    $(".notice_main").stop(true, true);
    $(".notice_main").show();
}

//kiosk_contents를 읽기
function setContents() {
    var t_url = m_contents_url;
    $.ajax({
        url: t_url,
        dataType: 'json',
        success: function (data) {
            m_header = data.header;
            m_logo_url = data.header.logo_url;
            m_notice_list = data.notice_list;
            m_main_video_list = convMainVideoList(data.main_video_list);
            m_admin_video_list = data.admin_video_list;
            setInitSetting();
            setTimeout(setHideCover, 500);
        },
        error: function (xhr, status, error) {
            console.error('컨텐츠 에러 발생:', status, error);
        },
    });
}

function convMainVideoList(_list) {
    let t_list = [];
    for (var i = 0; i < _list.length; i += 1) {
        if (i < m_pos_list.length) {
            t_list.push(_list[i]);
        }
    }
    return t_list;
}


function getTimeCheck(_json) {

    const date = new Date();
    const i_date = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const i_time = date.getHours() * 100 + date.getMinutes();

    const i_sday = parseInt(_json.sday);
    const i_eday = parseInt(_json.eday);
    const i_stime = parseInt(_json.stime);
    const i_etime = parseInt(_json.etime);

    if (i_sday <= i_date && i_eday >= i_date) {
        if (i_stime <= i_time && i_etime >= i_time) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function setNoticeDrawInfo() {
    m_curr_video_zone = null;
    var str_type = '';
    var str_show = '',
        str_hide = '';
    if (m_notice_list.length == 0) return;

    m_curr_notice_cnt++;
    if (m_curr_notice_cnt >= m_notice_list.length) m_curr_notice_cnt = 0;

    var obj = m_notice_list[m_curr_notice_cnt];

    if (getTimeCheck(obj) == false) {
        setNoticeDrawInfo();
        return;
    }
    console.log("setNoticeDrawInfo", obj.id, m_curr_notice, obj.type);

    if (m_curr_notice == 1) {
        m_curr_notice = 2;
        str_show = 'id_notice_box_02';
        str_hide = 'id_notice_box_01';
        $('#id_notice_box_01').css('zIndex', 9);
        $('#id_notice_box_02').css('zIndex', 10);
    } else {
        m_curr_notice = 1;
        str_show = 'id_notice_box_01';
        str_hide = 'id_notice_box_02';
        $('#id_notice_box_01').css('zIndex', 10);
        $('#id_notice_box_02').css('zIndex', 9);
    }

    m_curr_notice_type = obj.type;
    if (obj.type == "MOV") {
        $('#' + str_show + ' > video').attr('src', convFilePath(obj.file_url));
        $('#' + str_show + ' > video').show();
        $('#' + str_show + ' > img').hide();
        $('#' + str_show).children('video')[0].play();
        setAllVideoMute();
        setCallWebToApp("UNMUTE", $('#' + str_show).children('video').attr("id"));
        //setCallWebToApp("UNMUTE", "UNMUTE");
    } else if (obj.type == "IMG") {
        $('#' + str_show + ' > img').attr('src', convFilePath(obj.file_url));
        $('#' + str_show + ' > video').hide();
        $('#' + str_show).children('video')[0].pause();
        $('#' + str_show + ' > img').show();
    }
    m_curr_notice_ptime = parseInt(obj.ptime);
    if (m_curr_notice_ptime < 5) m_curr_notice_ptime = 5;
    m_curr_notice_ptime = m_curr_notice_ptime * 1000;
    clearTimeout(m_notice_timeout);
    m_notice_timeout = setTimeout(setMainTimeOut, m_curr_notice_ptime);
    setTimeout(setNoticeDrawInfoEnd, 10);
}

function setNoticeVideoStop() {
    console.log("setNoticeVideoStop");
    try {
        $("#id_notice_box_01").children("video")[0].pause();
    } catch (err) {}
    try {
        $("#id_notice_box_02").children("video")[0].pause();
    } catch (err) {}
    clearTimeout(m_notice_timeout);
}

function setMainTimeOut() {
    if ($('#id_main_screen_0').css('display') == 'none') {
        return;
    } else {
        setNoticeDrawInfo();
    }
}

function setNoticeDrawInfoEnd() {
    if (m_notice_list.length == 1) {
        if (m_curr_notice == 1) {
            $('#id_notice_box_01').fadeIn();
            setTimeout(setHideNotice, 500, '#id_notice_box_02');
        } else {
            $('#id_notice_box_02').fadeIn();
            setTimeout(setHideNotice, 500, '#id_notice_box_01');
        }
    } else {
        if (m_curr_notice == 1) {
            $('#id_notice_box_01').fadeIn();
            setTimeout(setHideNotice, 500, '#id_notice_box_02');
        } else {
            $('#id_notice_box_02').fadeIn();
            setTimeout(setHideNotice, 500, '#id_notice_box_01');
        }
    }
}

function setHideNotice(_str) {
    console.log(_str);
    $(_str).hide();
}

function setAllVideoMute() {
    console.log("setAllVideoMute");
    $('video').each(function () {
        $(this).prop('muted', true);
    });
}

function setVideoStart() {
    //"START"
    setAllVideoMute();
    setAllVideoPause();
    setTimeout(setOthersVideoClear,500);
    if (m_curr_video_zone != null) {
        setVideoListStop("");
    }
    m_curr_video_zone = null;
    let t_video_zone = null;
    let t_video = null;
    let t_img = null;
    let t_obj = null;
    $(".admin_video_page").fadeOut(1000);
    if (m_main_video_list.length > 0) {
        for (var i = 0; i < m_main_video_list.length; i += 1) {
            t_obj = getVideoCode(i);
            t_video = $(".video_page .video_zone[code='" + i + "'] video");
            t_video_zone = $(".video_page .video_zone[code='" + i + "']");
            t_img = $(".video_page .video_zone[code='" + i + "'] img");
            if(t_obj.type=="MOV"){
                let src = $(t_video).attr("src");
                if (!src) {
                    t_video.attr('src', convFilePath(t_obj.file_url));
                }
                if (t_video[0].paused) {
                    //t_video[0].play();
                }
            }else{
                t_video.hide();
            }
            t_img.show();
            t_video_zone.css("top", m_pos_list[i].y);
            t_video_zone.css("left", m_pos_list[i].x);
            t_video_zone.css("width", 688);
            t_video_zone.css("height", 556);
        }
        $(".video_page .image_zone[code='5']").css("top", m_pos_list[5].y);
        $(".video_page .image_zone[code='5']").css("left", m_pos_list[5].x);
    }
    $(".video_page").fadeIn(1000);
}

function setCommand(_str) {
    console.log("setCommand", _str);
    let t_list = _str.split("|");
    let cmd = t_list[0];
    let arg = t_list[1];
    if (cmd.toUpperCase() == "START") {
        setNoticeVideoStop();
        $(".notice_main").fadeOut(1000);
        setVideoStart();
    } else if (cmd.toUpperCase() == "PLAY") {
        setVideoListPlay(arg);
    } else if (cmd.toUpperCase() == "STOP") {
        setVideoListStop(arg);
    } else if (cmd.toUpperCase() == "ADMIN_START") {
        setAdminModeStart(arg);
    }  else if (cmd.toUpperCase() == "ADMIN_STOP") {
        setAdminModeStop(arg);
    } else if (cmd.toUpperCase() == "ADMIN_PLAY") {
        setAdminVideoPlay(arg);
    } else if (cmd.toUpperCase() == "PAUSE") {
        setVideoListPause(arg);
    } else if (cmd.toUpperCase() == "RESUME") {
        setVideoListResume(arg);
    } else if (cmd.toUpperCase() == "RESET") {
        setMainReset();
    }
}

function setVideoListStop(_code) {
    //"stop"
    console.log("setVideoListStop");
    if (m_curr_video_zone != null) {
        if(m_curr_video_zone.attr("code")==undefined){
            return;
        }
        setAllVideoMute();
        let t_code = m_curr_video_zone.attr("code");
        if (t_code != undefined) {
            m_curr_video_zone.css("z-index", "15");
            let t_temp_video_zone = m_curr_video_zone;
            gsap.fromTo(
                m_curr_video_zone, {}, {
                    duration: 0.5,
                    top: m_pos_list[t_code].y,
                    left: m_pos_list[t_code].x,
                    width: 688,
                    height: 556,
                    ease: 'power2.inOut',
                    onComplete: function () {
                        t_temp_video_zone.css("z-index", "10");
                    }
                }
            );
            if(m_curr_video_zone.attr("type") == "MOV"){
                m_curr_video_zone.find("video")[0].pause(); 
                m_curr_video_zone.find(".img_zone").fadeIn(1000);
            }else{
                m_curr_video_zone.find(".img_zone").show();
            }
            m_curr_video_zone = null;
        }
    }
    /*
    if (m_main_video_list.length > 0) {
        for (var i = 0; i < m_main_video_list.length; i += 1) {
            $(".video_page .video_zone[code='" + i + "'] video")[0].play();
        }
    }
    */
}

function setAdminModeStop(_arg) {
    //admin_start
    console.log("setAdminModeStop");
    $(".admin_video_page").stop(true, true);
    if ($(".admin_video_page").css('display') != 'none') {
        setAllVideoPause();
        $(".admin_video_page .video_zone").fadeOut();
        $("#id_admin_box_img").show();
    }
}

function setAdminModeStart(_arg) {
    //admin_start
    console.log("setAdminModeStart");
    $(".admin_video_page").stop(true, true);
    if ($(".notice_main").css('display') != 'none') {
        setTimeout(setNoticeVideoStop, 1000);
        $(".notice_main").fadeOut(1000);
        $(".admin_video_page").show();
        $(".admin_video_page .video_zone").hide();
    } else if ($(".admin_video_page").css('display') != 'none') {
        setAllVideoPause();
        $(".admin_video_page .video_zone").fadeOut();
        $("#id_admin_box_img").show();
    } else {
        $(".video_page").fadeOut(1000);
        setAllVideoMute();
        setAllVideoPause();
        $(".admin_video_page video").attr('src', "");
        $(".admin_video_page").show();
        $(".admin_video_page .video_zone").hide();
        $("#id_admin_box_img").hide();
        $("#id_admin_box_img").fadeIn(1000);
    }
}

function setAllMainVideoRemove() {

    if (m_main_video_list.length > 0) {
        for (var i = 0; i < m_main_video_list.length; i += 1) {
            t_video = $(".video_page .video_zone[code='" + i + "'] video");
            t_video_zone = $(".video_page .video_zone[code='" + i + "']");
            t_video[0].src = "";
            t_video[0].load();
        }
    }
}

function setAllVideoPause() {
    console.log("setAllVideoPause");
    let videos = $("video");
    videos.each(function () {
        const video = this;
        video.pause();
    });
}
function setAllVideoClear() {
    console.log("setAllVideoClear");
    let videos = $("video");
    videos.each(function () {
        const video = this;
        video.src = '';
        video.load();
    });
}

function setOthersVideoClear() {
    console.log("setOthersVideoClear");
    $("#id_notice_video_1")[0].src = "";
    $("#id_notice_video_2")[0].src = "";
    $("#id_admin_video_1")[0].src = "";
    $("#id_admin_video_2")[0].src = "";
}

function setMainVideoClear() {
    console.log("setMainVideoClear");
    $("#id_main_video_0")[0].src = "";
    $("#id_main_video_1")[0].src = "";
    $("#id_main_video_2")[0].src = "";
    $("#id_main_video_3")[0].src = "";
    $("#id_main_video_4")[0].src = "";
}

function setShowInnerBorder() {
    console.log("setShowInnerBorder");
    $(".inner_border").show();
}

function setVideoListResume(_code) {
    console.log("setVideoListResume");
    if (m_curr_video_zone != null) {
        $(m_curr_video_zone).find("video")[0].play();
    }
}

function setVideoListPause(_code) {
    console.log("setVideoListPause");
    if (m_curr_video_zone != null) {
        $(m_curr_video_zone).find("video")[0].pause();
    }
}

function setAdminVideoPlay(_code) {
    //"admin_play"
    console.log("setAdminVideoPlay", _code);
    if (getAdminVideoCode(_code) == undefined) {
        return;
    }
    
    var str_show = '',
        str_hide = '';

    $(".admin_video_page").stop(true, true);
    if ($(".notice_main").css('display') != 'none') {
        $("#id_admin_box_img").hide();
        setTimeout(setNoticeVideoStop, 1000);
        $(".notice_main").fadeOut(1000);
        $(".admin_video_page").show();
    } else if ($(".video_page").css('display') != 'none') {
        $("#id_admin_box_img").hide();
        $(".admin_video_page").show();
        $(".video_page").fadeOut(1000);
    } else {
        $(".admin_video_page").show(1000);
    }

    if (m_curr_admin == 1) {
        m_curr_admin = 2;
        m_curr_video_zone = $('#id_admin_box_02');
        str_show = 'id_admin_box_02';
        str_hide = 'id_admin_box_01';
        $('#id_admin_box_02').css('zIndex', 10);
        $('#id_admin_box_01').css('zIndex', 9);
    } else {
        m_curr_admin = 1;
        m_curr_video_zone = $('#id_admin_box_01');
        str_show = 'id_admin_box_01';
        str_hide = 'id_admin_box_02';
        $('#id_admin_box_01').css('zIndex', 10);
        $('#id_admin_box_02').css('zIndex', 9);
    }


    if (m_main_video_list.length > 0) {
        setAllVideoMute();
        setAllVideoPause();
        setTimeout(setMainVideoClear,500);
        //setAllMainVideoRemove();
    }


    //$('#' + str_show).children('video')[0].load(convFilePath(getAdminVideoCode(_code).file_url));

    $('#' + str_show + ' > video').attr('src', convFilePath(getAdminVideoCode(_code).file_url));
    //$('#' + str_show).children('video')[0].play();
    $('#' + str_show).fadeIn();
    setCallWebToApp("UNMUTE", $('#' + str_show).children('video').attr("id"));

    let t_str = str_hide;
    if ($('#' + t_str + ' > video')[0].currentSrc) {
        $('#' + t_str + ' > video')[0].pause();
    }
    clearTimeout(m_admin_timeout);
    m_admin_timeout = setTimeout(function () {
        $('#' + t_str).hide();
        $('#' + t_str + ' > video').attr('src', "");
    }, 500);
}

function setVideoListPlay(_code) {
    //"play"
    console.log("setVideoListPlay", _code);

    if ($(".notice_main").css('display') != 'none') {
        setNoticeVideoStop();
        $(".notice_main").fadeOut(1000);
    }

    $(".video_page").stop(true, true);
    $(".video_page").fadeIn(1000);
    if (_code == "all") {
        setAllVideoPositionReset();
        if ($('.admin_video_page').css('display') != 'none') {
            setAllVideoPause();
            $(".admin_video_page").fadeOut(1000);
            setTimeout(function () {
                $('.admin_video_page video').attr('src', "");
            }, 1000);
        }
        m_curr_video_zone = null;
    } else {
        if ($('.admin_video_page').css('display') != 'none') {
            setAllVideoPause();
            $(".admin_video_page").fadeOut(1000);
            setTimeout(function () {
                $('.admin_video_page video').attr('src', "");
            }, 1000);
        }
        if (m_main_video_list.length > 0) {
            setAllVideoPause();
        }
        if (m_curr_video_zone != null) {
            setVideoListStop("");
        }
        m_curr_video_zone = $(".video_page .video_zone[code='" + _code + "']");
        if (m_curr_video_zone[0] == undefined) {
            m_curr_video_zone = null;
            /*
            if (m_main_video_list.length > 0) {
                for (var i = 0; i < m_main_video_list.length; i += 1) {
                    $(".video_page .video_zone[code='" + i + "'] video")[0].play();
                }
            }
            */
            return;
        }
        m_curr_video_zone.css("z-index", "20");
        if(m_curr_video_zone.attr("type") == "MOV"){
            m_curr_video_zone.find(".img_zone").fadeOut(1000);
            m_curr_video_zone.find("video")[0].currentTime = 0;
            m_curr_video_zone.find("video")[0].play();
            setAllVideoMute();
            setCallWebToApp("UNMUTE", m_curr_video_zone.children('video').attr("id"));
        }else{
            m_curr_video_zone.find(".img_zone").show();
        }
        gsap.fromTo(
            m_curr_video_zone, {}, // 시작값
            {
                duration: 0.5,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                ease: 'power2.inOut',
                onComplete: function () {
                    m_curr_video_zone.css("z-index", "20");
                }
            }
        );
    }
}

function setAllVideoPositionReset() {
    let t_video_zone = null;
    for (var i = 0; i < m_main_video_list.length; i += 1) {
        t_video_zone = $(".video_page .video_zone[code='" + i + "']");
        t_video_zone.css("z-index", "10");
        t_video_zone.css("top", m_pos_list[i].y);
        t_video_zone.css("left", m_pos_list[i].x);
        t_video_zone.css("width", 688);
        t_video_zone.css("height", 556);
    }
    //setShowInnerBorder();
}

function setInitFsCommand() {
    if (window.chrome.webview) {
        window.chrome.webview.addEventListener('message', (arg) => {
            console.log(arg.data);
            setCommand(arg.data);
        });
    }
}

function onClickDebug() {
    setCommand($(".input_zone").val());
    $(".input_zone").val("");
}
