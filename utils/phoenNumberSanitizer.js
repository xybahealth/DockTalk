const sanitizePhoneNumber=function sanitizePhoneNumber(number) {
    let _tempNumber=number;
    _tempNumber= _tempNumber.replaceAll("-", "").replaceAll("!", "").replaceAll("'", "").replaceAll(",", "").replaceAll("_", "").replaceAll("+", "").replaceAll("(", "").replaceAll(")", "").replaceAll(" ", "");
    _length=_tempNumber.length;
    _start=_length-10;
    _tempNumber=_tempNumber.substring(_start,_length);
    return _tempNumber;
}

module.exports={sanitizePhoneNumber};