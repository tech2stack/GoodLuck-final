// utils/jwtToken.js
const sendToken = (user, statusCode, res) => {
    const token = user.getSignedJwtToken(); 

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 
        ),
        httpOnly: true, 
        // secure: process.env.NODE_ENV === 'production', 
        // sameSite: 'lax' 
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user: { 
            _id: user._id,
            name: user.name || user.username, 
            username: user.username,          
            email: user.email,                
            role: user.role                   
        },
        token, 
    });
};

module.exports = sendToken;
