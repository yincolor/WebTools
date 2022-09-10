/* 存放一些同步的常用的函数 */

/**
 * 格式化字符串，字符串中使用@{param}作为等待替换的参数，param为参数key
 * @param {String} str 待格式化字符串：'http://www.fyrsks.com/s/@{searchKey}/@{page}/'
 * @param  {Object} argMap 字典类型的格式化变量：{searchKey:'我的', page:1}
 * @returns 
 */
function formatString(str, argMap) {
    if (Object.keys(argMap).length == 0) { return str; }
    const argList = str.match(/\@{.*?}/g);
    for (const arg of argList) {
        const k = arg.slice(2, -1);
        str = str.replace(arg, argMap[k]);
    }
    return str;
}

/**
 * async 异步函数中使用的延时函数
 * @param {Number} ms 延时时间长度，单位毫秒
 * @returns 
 */
async function asleep(ms) {
    return new Promise((resolve, _) => { setTimeout(() => resolve(true), ms); });
}

/**
 * 获得当前时间的格式化输出
 * @param {String} formatStr 输出格式：'\@{year}\/\@{month}\/\@{day} \@{hours}:\@{minutes}:\@{seconds}'
 * @returns 
 */
function now(formatStr) {
    const t = new Date();
    const year = t.getFullYear();
    const month = ('' + (t.getMonth() + 1)).padStart(2, '0');
    const day = ('' + t.getDate()).padStart(2, '0');
    const hours = ('' + t.getHours()).padStart(2, '0');
    const minutes = ('' + t.getMinutes()).padStart(2, '0');
    const seconds = ('' + t.getSeconds()).padStart(2, '0');
    return formatString(formatStr, { year: year, month: month, day: day, hours: hours, minutes: minutes, seconds: seconds });
}

/**
 * 打印格式化的日志
 * @param {String} _funcName 打印日志的方法名称
 * @param {String} _str 日志本体字符串
 */
function log(_funcName, _str) {
    const time = now('@{year}/@{month}/@{day} @{hours}:@{minutes}:@{seconds}');
    const logStr = '[' + time + '] ' + _funcName + ' : ' + _str;
    console.log(logStr);
    return logStr;
}

/**
 * 获取代码运行环境
 */
const env = {
    runtime : function(){
        try { window; return 'browser'; } catch { return 'node'; }
    }
}

/*base64编解码，伙计这会是一大坨代码...笑*/
const base64 = (function () {
    const BASE64_MAPPING = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
    ];
    const URLSAFE_BASE64_MAPPING = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_'
    ];

    function _toBinary(ascii) {
        const binary = [];
        while (ascii > 0) { const b = ascii % 2; ascii = Math.floor(ascii / 2); binary.push(b); }
        binary.reverse();
        return binary;
    }

    function _toDecimal(binary) {
        let dec = 0, p = 0;
        for (let i = binary.length - 1; i >= 0; --i) { if (binary[i] == 1) { dec += Math.pow(2, p); } ++p; }
        return dec;
    }

    function _toUTF8Binary(c, binaryArray) {
        // const mustLen = (8 - (c + 1)) + ((c - 1) * 6);
        // const fatLen = binaryArray.length;
        // let diff = mustLen - fatLen;
        let diff = (8 - (c + 1)) + ((c - 1) * 6) - binaryArray.length ; 
        while (--diff >= 0) { binaryArray.unshift(0); }
        const binary = [];
        let _c = c;
        while (--_c >= 0) { binary.push(1); }
        binary.push(0);
        let i = 0; const len = 8 - (c + 1);
        for (; i < len; ++i) { binary.push(binaryArray[i]); }
        for (let j = 0; j < c - 1; ++j) {
            binary.push(1); binary.push(0);
            let sum = 6;
            while (--sum >= 0) { binary.push(binaryArray[i++]); }
        }
        return binary;
    }

    function _toBinaryArray(str) {
        let binaryArray = [];
        for (let i = 0, len = str.length; i < len; ++i) {
            const unicode = str.charCodeAt(i);
            let _tmpBinary = _toBinary(unicode);
            if (unicode < 0x80) {
                let _tmpdiff = 8 - _tmpBinary.length;
                while (--_tmpdiff >= 0) { _tmpBinary.unshift(0); }
                binaryArray = binaryArray.concat(_tmpBinary);
            } else if (unicode >= 0x80 && unicode <= 0x7FF) {
                binaryArray = binaryArray.concat(_toUTF8Binary(2, _tmpBinary));
            } else if (unicode >= 0x800 && unicode <= 0xFFFF) {/*UTF-8 3byte*/
                binaryArray = binaryArray.concat(_toUTF8Binary(3, _tmpBinary));
            } else if (unicode >= 0x10000 && unicode <= 0x1FFFFF) {/*UTF-8 4byte*/
                binaryArray = binaryArray.concat(_toUTF8Binary(4, _tmpBinary));
            } else if (unicode >= 0x200000 && unicode <= 0x3FFFFFF) {/*UTF-8 5byte*/
                binaryArray = binaryArray.concat(_toUTF8Binary(5, _tmpBinary));
            } else if (unicode >= 4000000 && unicode <= 0x7FFFFFFF) {/*UTF-8 6byte*/
                binaryArray = binaryArray.concat(_toUTF8Binary(6, _tmpBinary));
            }
        }
        return binaryArray;
    }

    function _toUnicodeStr(binaryArray) {
        let unicode;
        let unicodeBinary = [];
        let str = "";
        for (let i = 0, len = binaryArray.length; i < len;) {
            if (binaryArray[i] == 0) {
                unicode = _toDecimal(binaryArray.slice(i, i + 8));
                str += String.fromCharCode(unicode);
                i += 8;
            } else {
                let sum = 0;
                while (i < len) {
                    if (binaryArray[i] == 1) { ++sum; } else { break; }
                    ++i;
                }
                unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 1, i + 8 - sum));
                i += 8 - sum;
                while (sum > 1) {
                    unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 2, i + 8));
                    i += 8;
                    --sum;
                }
                unicode = _toDecimal(unicodeBinary);
                str += String.fromCharCode(unicode);
                unicodeBinary = [];
            }
        }
        return str;
    }

    function _encode(str, url_safe) {
        const base64_Index = [];
        const binaryArray = _toBinaryArray(str);
        const dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;
        let extra_Zero_Count = 0;
        for (let i = 0, len = binaryArray.length; i < len; i += 6) {
            const diff = (i + 6) - len;
            if (diff == 2) {
                extra_Zero_Count = 2;
            } else if (diff == 4) {
                extra_Zero_Count = 4;
            }
            let _tmpExtra_Zero_Count = extra_Zero_Count;
            while (--_tmpExtra_Zero_Count >= 0) {
                binaryArray.push(0);
            }
            base64_Index.push(_toDecimal(binaryArray.slice(i, i + 6)));
        }

        let base64 = '';
        for (let i = 0, len = base64_Index.length; i < len; ++i) {
            base64 += dictionary[base64_Index[i]];
        }

        for (let i = 0, len = extra_Zero_Count / 2; i < len; ++i) {
            base64 += '=';
        }
        return base64;
    }

    function _decode(_base64Str, url_safe) {
        const _len = _base64Str.length;
        let extra_Zero_Count = 0;
        const dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;

        if (_base64Str.charAt(_len - 1) == '=') {
            if (_base64Str.charAt(_len - 2) == '=') {/*两个等号说明补了4个0*/
                extra_Zero_Count = 4; _base64Str = _base64Str.substring(0, _len - 2);
            } else {/*一个等号说明补了2个0*/
                extra_Zero_Count = 2; _base64Str = _base64Str.substring(0, _len - 1);
            }
        }

        let binaryArray = [];
        for (let i = 0, len = _base64Str.length; i < len; ++i) {
            const c = _base64Str.charAt(i);
            for (let j = 0, size = dictionary.length; j < size; ++j) {
                if (c == dictionary[j]) {
                    let _tmp = _toBinary(j);
                    /*不足6位的补0*/
                    const _tmpLen = _tmp.length;
                    if (6 - _tmpLen > 0) {
                        for (let k = 6 - _tmpLen; k > 0; --k) {
                            _tmp.unshift(0);
                        }
                    }
                    binaryArray = binaryArray.concat(_tmp);
                    break;
                }
            }
        }
        if (extra_Zero_Count > 0) {
            binaryArray = binaryArray.slice(0, binaryArray.length - extra_Zero_Count);
        }
        const str = _toUnicodeStr(binaryArray);
        return str;
    }
    return {
        encode:         function (textStr)   { return _encode(textStr,   false); },
        decode:         function (base64Str) { return _decode(base64Str, false); },
        urlsafe_encode: function (textStr)   { return _encode(textStr,   true ); },
        urlsafe_decode: function (base64Str) { return _decode(base64Str, true ); }
    }
})();

/** 随机 */
const rand = {
    between: function(min, max){
        return parseInt(Math.random()*(max+1-min)) + min;
    }, 
    choice: function(arr){
        return arr[parseInt(Math.random()*( arr.length ))]; 
    }
}

/** 当 val 为有效值时，返回res1，否则返回res2 */
function nvl(val, res1, res2){
    if(val || val == 0) { return res1; } else { return res2; }
}

/*输出模块，在使用之前根据运行环境，手动选择模块输出方式*/
const ___out_module = {
    formatString,
    asleep,
    now,
    log,
    env,
    base64,
    rand,
    nvl,
};
module.exports = ___out_module;
/*export default ___out_module;*/