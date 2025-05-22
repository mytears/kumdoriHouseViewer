function setLoadDataContentsXml(_url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var xmlDoc = xhr.responseXML;
            setParsingContentsXml(xmlDoc);
        }
    };
    xhr.open("GET", _url, true);
    xhr.send();
}

function setParsingContentsXml(xmlDoc) {
    var ret_code = "FAIL";

    try {
        var root = xmlDoc.getElementsByTagName("KIOSK")[0];
        if (!root) {
            setInitSetting("FAIL DATA");
            return;
        }

        // HEADER 처리
        var headerNode = root.getElementsByTagName("HEADER")[0];
        m_header = {};
        if (headerNode) {
            function getTagText(tagName) {
                var el = headerNode.getElementsByTagName(tagName)[0];
                return setConvXmlTag(el ? el.textContent : "");
            }

            m_header.RET_CODE = getTagText("RET_CODE");
            m_header.BRN_CODE = getTagText("BRN_CODE");
            m_header.KIOSK_PASSWD = getTagText("KIOSK_PASSWD");
            m_header.KIOSK_ID = getTagText("KIOSK_ID");
            m_header.KIOSK_CODE = getTagText("KIOSK_CODE");
            m_header.KIOSK_SECT = getTagText("KIOSK_SECT");
            m_header.KIOSK_TYPE = getTagText("KIOSK_TYPE");
            m_header.URL_REPORT = getTagText("URL_REPORT");
            m_header.URL_STATUS = getTagText("URL_STATUS");

            ret_code = m_header.RET_CODE;
        }

        // NOTICE_LIST 처리
        m_notice_list = [];
        var noticeInfos = root.getElementsByTagName("NOTICE_INFO");
        for (var i = 0; i < noticeInfos.length; i++) {
            var node = noticeInfos[i];
            var obj = {};

            obj.ID = setConvXmlTag(node.getAttribute("id"));
            obj.TYPE = setConvXmlTag(node.getAttribute("type"));

            var schNode = node.getElementsByTagName("SCH_TYPE")[0];
            if (schNode) {
                obj.SCH_TYPE = setConvXmlTag(schNode.textContent || "");
                obj.SDAY = setConvXmlTag(schNode.getAttribute("sday"));
                obj.EDAY = setConvXmlTag(schNode.getAttribute("eday"));
                obj.STIME = setConvXmlTag(schNode.getAttribute("stime"));
                obj.ETIME = setConvXmlTag(schNode.getAttribute("etime"));
            }

            var nameNode = node.getElementsByTagName("NOTICE_NAME")[0];
            obj.NOTICE_NAME = setConvXmlTag(nameNode ? nameNode.textContent : "");

            var fileNode = node.getElementsByTagName("FILE_URL")[0];
            obj.FILE_URL = setConvXmlTag(fileNode ? fileNode.textContent : "");
            obj.PTIME = setConvXmlNum(fileNode ? fileNode.getAttribute("ptime") : "", 10);

            var now = new Date();
            var today_str = now.getFullYear().toString().padStart(4, "0") +
                (now.getMonth() + 1).toString().padStart(2, "0") +
                now.getDate().toString().padStart(2, "0");
            var today = parseInt(today_str, 10);
            var sday_num = 0;
            var eday_num = 0;


            if (obj.FILE_URL !== "") {
                sday_num = parseInt(obj.SDAY, 10);
                eday_num = parseInt(obj.EDAY, 10);
                if(today >= sday_num && today <= eday_num){
                    m_notice_list.push(obj);
                }
            }
        }

        // CONTENTS_LIST 처리
        m_contents_list = [];
        var contentInfos = root.getElementsByTagName("CONTENTS_INFO");
        for (var i = 0; i < contentInfos.length; i++) {
            var node = contentInfos[i];
            var obj = {};

            obj.ID = setConvXmlTag(node.getAttribute("id"));
            obj.TYPE = setConvXmlTag(node.getAttribute("type"));

            var schNode = node.getElementsByTagName("SCH_TYPE")[0];
            if (schNode) {
                obj.SCH_TYPE = setConvXmlTag(schNode.textContent || "");
                obj.SDAY = setConvXmlTag(schNode.getAttribute("sday"));
                obj.EDAY = setConvXmlTag(schNode.getAttribute("eday"));
                obj.STIME = setConvXmlTag(schNode.getAttribute("stime"));
                obj.ETIME = setConvXmlTag(schNode.getAttribute("etime"));
            }

            var nameNode = node.getElementsByTagName("CONTENTS_NAME")[0];
            obj.CONTENTS_NAME = setConvXmlTag(nameNode ? nameNode.textContent : "");

            var fileNode = node.getElementsByTagName("FILE_URL")[0];
            obj.FILE_URL = setConvXmlTag(fileNode ? fileNode.textContent : "");

            var thumNode = node.getElementsByTagName("THUM_URL")[0];
            obj.THUM_URL = setConvXmlTag(thumNode ? thumNode.textContent : "");

            obj.NUM = 0;

            if (obj.FILE_URL !== "") {
                m_contents_list.push(obj);
            }
        }

    } catch (err) {
        console.log("XML Parse Error:", err);
        ret_code = "FAIL XML Data Error : " + err;
    }

    setInitSetting(ret_code);
}


function setConvXmlTag(p_src) {
    var p1 = /&amp;/gi;
    var p2 = /&lt;/gi;
    var p3 = /&gt;/gi;
    var p4 = /&quot;/gi;
    var p5 = /&apos;/gi;

    if (p_src == null || p_src == undefined) {
        return "";
    }

    p_src = p_src + "";
    p_src = p_src.replace(p1, "&");
    p_src = p_src.replace(p2, "<");
    p_src = p_src.replace(p3, ">");
    p_src = p_src.replace(p4, "\"");
    p_src = p_src.replace(p5, "\'");
    p_src = p_src.trim();
    return p_src;
}

function setConvXmlNum(p_src, p_default) {
    if (p_default == undefined) p_default = 0;
    if (p_src == null) return p_default;
    if (isNaN(p_src) == true) return p_default;
    return Number(p_src);
}


function setConvNoticeOrder() {
    var n_list = m_notice_list;
    var o_list = m_xml_data.arr_order_list;
    var t_list = [];

    for (var i = 0; i < o_list.length; i += 1) {
        for (var j = 0; j < n_list.length; j += 1) {
            if (o_list[i] == n_list[j].ID) {
                //console.log(n_list[j].FILE_URL);
                t_list.push(n_list[j]);
            }
        }
    }
    m_notice_list = t_list;
}

function setLoadRouteContents() {
    var xhr;
    var m_this = this;

    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) {
            return;
        }
        // 성공을 했다.
        if (xhr.status == 200) {
            var xml_doc = xhr.responseXML;
            onReadXmlRouteContents(xml_doc);
        } else {

        }
    };
    xhr.open("GET", gl_xml_conf.url_route, true);
    xhr.send();
}

function onReadXmlRouteContents(_data) {
    var ret_code = "FAIL";

    gl_xml_conf.xml_route.header = new Object();
    gl_xml_conf.xml_route.arr_node_list = new Array();
    gl_xml_conf.xml_route.arr_store_list = new Array();
    gl_xml_conf.xml_route.arr_pub_list = new Array();
    gl_xml_conf.xml_route.arr_shape_list = new Array();
    gl_xml_conf.xml_route.arr_park_list = new Array();

    try {

        var root_node = _data.getElementsByTagName("KIOSK")[0];
        if (!root_node) {
            setInitSetting("FAIL ROUTE");
            return;
        }

        var i = 0;
        var str_tmp = "";
        var child1 = root_node.firstChild;
        var child2;
        var child3;

        while (child1 != null && child1.nodeType != 4) {

            if (child1.nodeType == 1) {

                if (child1.nodeName == "HEADER") {

                    child2 = child1.firstChild;
                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "RET_CODE") {
                            ret_code = this.setConvXmlTag(child2.childNodes[0].nodeValue);
                        }
                        child2 = child2.nextSibling;
                    }

                } else if (child1.nodeName == "STORE_LIST") {

                    child2 = child1.firstChild;

                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "STORE_INFO") {
                            child3 = child2.firstChild;

                            var CObj = new Object();
                            CObj.ID = this.setConvXmlTag(child2.getAttribute("id"));
                            while (child3 != null && child3.nodeType != 4) {

                                if (child3.nodeName == "STORE_NAME_KOR")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "STORE_NAME_ENG")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "STORE_NAME_CHN")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "STORE_NAME_JPN")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                if (child3.nodeName == "FONT_COLOR")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "FONT_SIZE")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                if (child3.nodeName == "STORE_FLOOR") {
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                    CObj.POS_X = this.setConvXmlTag(child3.getAttribute("pos_x"));
                                    CObj.POS_Y = this.setConvXmlTag(child3.getAttribute("pos_y"));
                                }
                                if (child3.nodeName == "GATE_POS_X")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "GATE_POS_Y")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                child3 = child3.nextSibling;
                            }

                            CObj.ID = this.setConvXmlTag(CObj.ID);

                            CObj.STORE_NAME_KOR = this.setConvXmlTag(CObj.STORE_NAME_KOR);
                            CObj.STORE_NAME_ENG = this.setConvXmlTag(CObj.STORE_NAME_ENG);
                            CObj.STORE_NAME_CHN = this.setConvXmlTag(CObj.STORE_NAME_CHN);
                            CObj.STORE_NAME_JPN = this.setConvXmlTag(CObj.STORE_NAME_JPN);
                            CObj.FONT_COLOR = this.setConvXmlTag(CObj.FONT_COLOR);
                            CObj.FONT_SIZE = this.setConvXmlNum(CObj.FONT_SIZE, 30);
                            CObj.STORE_FLOOR = this.setConvXmlTag(CObj.STORE_FLOOR);
                            CObj.POS_X = this.setConvXmlNum(CObj.POS_X, 0);
                            CObj.POS_Y = this.setConvXmlNum(CObj.POS_Y, 0);
                            CObj.GATE_POS_X = this.setConvXmlTag(CObj.GATE_POS_X);
                            CObj.GATE_POS_Y = this.setConvXmlTag(CObj.GATE_POS_Y);

                            gl_xml_conf.xml_route.arr_store_list.push(CObj);
                        }

                        child2 = child2.nextSibling;
                    }

                } else if (child1.nodeName == "PUB_LIST") {

                    child2 = child1.firstChild;

                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "PUB_INFO") {
                            child3 = child2.firstChild;

                            var CObj = new Object();

                            CObj.ID = this.setConvXmlTag(child2.getAttribute("id"));
                            CObj.STATUS = this.setConvXmlTag(child2.getAttribute("status"));
                            CObj.AREA = this.setConvXmlTag(child2.getAttribute("area"));
                            CObj.SECT = this.setConvXmlTag(child2.getAttribute("sect"));
                            CObj.MOVE_FLOOR = this.setConvXmlTag(child2.getAttribute("floor"));

                            while (child3 != null && child3.nodeType != 4) {
                                if (child3.nodeName == "PUB_ID")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "PUB_CODE")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                if (child3.nodeName == "PUB_FLOOR") {
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                    CObj.POS_X = this.setConvXmlTag(child3.getAttribute("pos_x"));
                                    CObj.POS_Y = this.setConvXmlTag(child3.getAttribute("pos_y"));
                                }
                                child3 = child3.nextSibling;
                            }

                            CObj.ID = this.setConvXmlTag(CObj.ID);
                            CObj.STATUS = this.setConvXmlTag(CObj.STATUS);
                            CObj.AREA = this.setConvXmlTag(CObj.AREA);
                            CObj.SECT = this.setConvXmlTag(CObj.SECT);
                            CObj.MOVE_FLOOR = this.setConvXmlTag(CObj.MOVE_FLOOR);

                            CObj.PUB_ID = this.setConvXmlTag(CObj.PUB_ID);
                            CObj.B_CODE = this.setConvXmlTag(CObj.B_CODE);
                            CObj.PUB_FLOOR = this.setConvXmlTag(CObj.PUB_FLOOR);
                            CObj.POS_X = this.setConvXmlNum(CObj.POS_X, 0);
                            CObj.POS_Y = this.setConvXmlNum(CObj.POS_Y, 0);

                            if (CObj.POS_X != 0 && CObj.POS_Y != 0) {
                                gl_xml_conf.xml_route.arr_pub_list.push(CObj);
                            }
                        }
                        child2 = child2.nextSibling;
                    }

                } else if (child1.nodeName == "SHAPE_LIST") {

                    child2 = child1.firstChild;

                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "SHAPE_INFO") {
                            child3 = child2.firstChild;

                            var CObj = new Object();

                            CObj.ID = this.setConvXmlTag(child2.getAttribute("id"));
                            CObj.TYPE = this.setConvXmlTag(child2.getAttribute("type"));

                            while (child3 != null && child3.nodeType != 4) {
                                if (child3.nodeName == "POINTS_X")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "POINTS_Y")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "IMG_URL")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "FILL_COLOR")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "LINE_COLOR")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                if (child3.nodeName == "LINE_THICK")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                if (child3.nodeName == "SHAPE_TEXT") {
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                    CObj.ALIGN = this.setConvXmlTag(child3.getAttribute("align"));
                                    CObj.FONT_SIZE = this.setConvXmlTag(child3.getAttribute("font_size"));
                                }

                                if (child3.nodeName == "SHAPE_FLOOR") {
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                    CObj.POS_X = this.setConvXmlTag(child3.getAttribute("pos_x"));
                                    CObj.POS_Y = this.setConvXmlTag(child3.getAttribute("pos_y"));
                                    CObj.WIDTH = this.setConvXmlTag(child3.getAttribute("width"));
                                    CObj.HEIGHT = this.setConvXmlTag(child3.getAttribute("height"));
                                    CObj.ANGLE = this.setConvXmlTag(child3.getAttribute("angle"));
                                }
                                child3 = child3.nextSibling;
                            }


                            CObj.ID = this.setConvXmlTag(CObj.ID);
                            CObj.TYPE = this.setConvXmlTag(CObj.TYPE);
                            CObj.POINTS_X = this.setConvXmlTag(CObj.POINTS_X);
                            CObj.POINTS_Y = this.setConvXmlTag(CObj.POINTS_Y);
                            CObj.IMG_URL = this.setConvXmlTag(CObj.IMG_URL);

                            CObj.FILL_COLOR = this.setConvXmlTag(CObj.FILL_COLOR);
                            CObj.LINE_COLOR = this.setConvXmlTag(CObj.LINE_COLOR);
                            CObj.LINE_THICK = this.setConvXmlTag(CObj.LINE_THICK);

                            CObj.SHAPE_TEXT = this.setConvXmlTag(CObj.SHAPE_TEXT);
                            CObj.ALIGN = this.setConvXmlTag(CObj.ALIGN);
                            CObj.FONT_SIZE = this.setConvXmlTag(CObj.FONT_SIZE);

                            CObj.SHAPE_FLOOR = this.setConvXmlTag(CObj.SHAPE_FLOOR);
                            CObj.POS_X = this.setConvXmlNum(CObj.POS_X, 0);
                            CObj.POS_Y = this.setConvXmlNum(CObj.POS_Y, 0);
                            CObj.WIDTH = this.setConvXmlNum(CObj.WIDTH, 0);
                            CObj.HEIGHT = this.setConvXmlNum(CObj.HEIGHT, 0);
                            CObj.ANGLE = this.setConvXmlNum(CObj.ANGLE, 0);

                            gl_xml_conf.xml_route.arr_shape_list.push(CObj);
                        }

                        child2 = child2.nextSibling;
                    }

                } else if (child1.nodeName == "NODE_LIST") {
                    child2 = child1.firstChild;
                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "NODE_INFO") {
                            child3 = child2.firstChild;
                            var CObj = new Object();
                            CObj.FLOOR = this.setConvXmlTag(child2.getAttribute("floor"));
                            CObj.POS_X1 = this.setConvXmlNum(child2.getAttribute("x1"), 0);
                            CObj.POS_X2 = this.setConvXmlNum(child2.getAttribute("x2"), 0);
                            CObj.POS_Y1 = this.setConvXmlNum(child2.getAttribute("y1"), 0);
                            CObj.POS_Y2 = this.setConvXmlNum(child2.getAttribute("y2"), 0);
                            CObj.DIRECTION = this.setConvXmlTag(child2.getAttribute("direction"));
                            CObj.STIME = this.setConvXmlTag(child2.getAttribute("stime"));
                            CObj.ETIME = this.setConvXmlTag(child2.getAttribute("etime"));

                            CObj.POS_X1 = this.setConvXmlNum(CObj.POS_X1, -1);
                            CObj.POS_X2 = this.setConvXmlNum(CObj.POS_X2, -1);
                            CObj.POS_Y1 = this.setConvXmlNum(CObj.POS_Y1, -1);
                            CObj.POS_Y2 = this.setConvXmlNum(CObj.POS_Y2, -1);

                            gl_xml_conf.xml_route.arr_node_list.push(CObj);
                        }

                        child2 = child2.nextSibling;
                    }

                } else if (child1.nodeName == "PARK_LIST") {
                    child2 = child1.firstChild;
                    while (child2 != null && child2.nodeType != 4) {
                        if (child2.nodeName == "PARK_INFO") {

                            child3 = child2.firstChild;

                            var CObj = new Object();

                            CObj.ID = this.setConvXmlTag(child2.getAttribute("id"));

                            while (child3 != null && child3.nodeType != 4) {

                                if (child3.nodeName == "PARK_CODE")
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;

                                if (child3.nodeName == "PARK_FLOOR") {
                                    if (child3.childNodes[0]) CObj[child3.nodeName] = child3.childNodes[0].nodeValue;
                                    CObj.POS_X = this.setConvXmlTag(child3.getAttribute("pos_x"));
                                    CObj.POS_Y = this.setConvXmlTag(child3.getAttribute("pos_y"));
                                }

                                child3 = child3.nextSibling;
                            }

                            CObj.PARK_CODE = this.setConvXmlTag(CObj.PARK_CODE);
                            CObj.PARK_FLOOR = this.setConvXmlTag(CObj.PARK_FLOOR);

                            CObj.POS_X = this.setConvXmlNum(CObj.POS_X, 0);
                            CObj.POS_Y = this.setConvXmlNum(CObj.POS_Y, 0);

                            gl_xml_conf.xml_route.arr_park_list.push(CObj);
                        }

                        child2 = child2.nextSibling;
                    }

                } // END LIST
            }

            child1 = child1.nextSibling;
        }
    } catch (err) {
        ret_code = "FAIL XML ROUTE ERROR : " + err;
    }

    setInitSetting(ret_code);
}

// function setLoadContents(p_url)
function setLoadLanguage(p_url) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) {
            return;
        }
        //데이터가 확실하게 들어왔을 때 데이터 바인딩 시작
        if (xhr.status == 200) {

            var xml_doc = JSON.parse(this.response);
            // var xml_doc = this.response;
            if (typeof gl_jsop_lang_data !== 'undefined') {
                console.log("setLoadLanguage OK");
                var json_obj = xml_doc;

                if (typeof (setInitSettingLang) == 'function') {
                    setInitSettingLang(json_obj);
                }
            }
        } else {
            console.log("fail");
        }
    }
    xhr.open("GET", p_url, true);
    xhr.send();
}
