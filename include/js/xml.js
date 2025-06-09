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
        var root = xmlDoc.getElementsByTagName("DATA")[0];
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

        // 현재 날짜를 YYYYMMDD 형식의 숫자로 변환
        const now = new Date();
        const todayNum = parseInt(
            `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`,
            10
        );

        const noticeInfos = xmlDoc.getElementsByTagName("NOTICE_INFO");
        for (const node of noticeInfos) {
            const obj = {};

            // 주요 속성 파싱 (문자열로 가져옴)
            obj.ID = node.getAttribute("id") || "";
            obj.SORT = node.getAttribute("sort") || "";
            obj.TYPE = node.getAttribute("type") || "";
            obj.RATIO = node.getAttribute("ratio") || "";

            // SCH_TYPE 노드 및 속성 파싱 (있을 경우)
            const schNode = node.getElementsByTagName("SCH_TYPE")[0];
            if (schNode) {
                obj.SCH_TYPE = schNode.textContent || "";
                obj.SDAY = schNode.getAttribute("sday") || "";
                obj.EDAY = schNode.getAttribute("eday") || "";
                obj.STIME = schNode.getAttribute("stime") || "";
                obj.ETIME = schNode.getAttribute("etime") || "";
            } else {
                // SCH_TYPE이 없을 경우 기본값 설정 또는 건너뛰기 처리
                obj.SCH_TYPE = "";
                obj.SDAY = "";
                obj.EDAY = "";
                obj.STIME = "";
                obj.ETIME = "";
            }
            const fileNode = node.getElementsByTagName("FILE_URL")[0];
            obj.FILE_URL = fileNode ? (fileNode.textContent || "") : "";
            obj.PTIME = fileNode ? parseInt(fileNode.getAttribute("ptime") || "0", 10) : 0;
            if (obj.FILE_URL) {
                const sdayNum = parseInt(obj.SDAY, 10);
                const edayNum = parseInt(obj.EDAY, 10);
                const isValidDateRange = !isNaN(sdayNum) && !isNaN(edayNum) &&
                    todayNum >= sdayNum && todayNum <= edayNum;

                if (!schNode || isValidDateRange) {
                    m_notice_list.push(obj);
                }
            }
        }
        m_notice_list = convSortList(m_notice_list, "SORT");

        // CONTENTS_LIST 처리
        m_contents_list = [];
        const mediaList = xmlDoc.getElementsByTagName("MEDIA_LIST")[0];
        // MEDIA_LIST 안에 있는 FILE_URL 태그들을 모두 가져옵니다.
        const fileUrls = mediaList.getElementsByTagName("FILE_URL");

        for (let i = 0; i < fileUrls.length; i++) {
            const node = fileUrls[i];
            const obj = {}; // 각 FILE_URL의 정보를 담을 객체
            obj.ID = node.getAttribute("id"); // ID는 문자열로 가져옴
            obj.RATIO = node.getAttribute("ratio");
            obj.PTIME = node.getAttribute("ptime"); // PTIME은 문자열로 가져옴
            obj.FILE_URL = node.textContent;
            obj.TYPE="MOV";
            obj.NUM = 0;
            m_contents_list.push(obj);
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

function convSortList(arr, key) {
    // 원본 배열을 변경하지 않고 새로운 배열을 반환하기 위해 slice() 사용
    return [...arr].sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        // 숫자 비교를 위한 간단한 오름차순 로직
        if (valA < valB) {
            return -1;
        }
        if (valA > valB) {
            return 1;
        }
        return 0; // 값이 같을 경우 순서 변경 없음
    });
}
