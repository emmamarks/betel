exports.genOTP = () => {
    let otp = ''
    for (let i = 0; i <=3; i++){
        const ranVal = Math.round(Math.random()*9)
        otp += ranVal
    }
    return otp
}