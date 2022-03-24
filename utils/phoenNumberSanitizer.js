const sanitizePhoneNumber=function sanitizePhoneNumber(number) {
    let _tempNumber=number;
    const regx1=/-/g;
    const regx2=/!/g;
    const regx3=/'/g;
    const regx4=/,/g;
    const regx5=/_/g;
    const regx6=/+/g;
    const regx7=/\(/g;
    const regx8=/)/g; 
    const regx9=/ /g;   
    _tempNumber= _tempNumber.replace(regx1, "").replace(regx2, "").replace(regx3, "").replace(regx4, "").replace(regx5, "").replace(regx6, "").replace(regx7, "").replace(regx8, "").replace(regx9, "");
    _length=_tempNumber.length;
    _start=_length-10;
    _tempNumber=_tempNumber.substring(_start,_length);
    return _tempNumber;
}

module.exports={sanitizePhoneNumber};