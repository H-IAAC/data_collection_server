const logger = require('../utils/logger'),
      jwt = require("jsonwebtoken"),
      bcrypt = require("bcryptjs"),
      utils = require('../utils/utils');

const config = utils.get_config();

module.exports = {

    async check_passwd (password) {
        if (config.password !== undefined && password)
            return await bcrypt.compare(password, config.password);
        else
            return false;
    },

    jwt_sign() {
        if (config === undefined || config.password === undefined)
            return false;        

        let char = config.tokenid, rnd = "";
        for (let i=0; i<16; i++) {
            rnd += char.charAt(Math.floor(Math.random() * char.length));
        }

        let now = Math.floor(Date.now() / 1000);

        return jwt.sign({
            iat : now, // issued at - time when token is generated
            nbf : now, // not before - when this token is considered valid
            exp : now + 3600, // expiry - 1 hr (3600 secs) from now in this example
            jti : rnd, // random token id
            iss : config.jwtIss,
            aud : config.jwtAud,
            data : { "H-IAAC" : "H-IAAC" } // any data
        }, config.jwtKey, { algorithm: config.jwtAlgo });
    },

    jwt_verify(cookies, url) {
        if (cookies.JWT === undefined) {
            logger.info("Blocked not authenticated access to: " + url);
            return false;
        }
        
        try {
            let decoded = jwt.verify(cookies.JWT, config.jwtKey);
            return true;
        } catch (err) {
            logger.error("Error when authenticating access to: " + url);
            return false;
        }
    }
}

