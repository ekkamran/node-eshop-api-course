const expressJwt = require('express-jwt');
const { User } = require('../models/user');

function authJwt() {
    const secret = process.env.SECRET;
    const api = process.env.API_URL;
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url: /\/api\/v1\/products(.*)/ , methods: ['GET', 'OPTIONS'] },
            {url: /\/api\/v1\/categories(.*)/ , methods: ['GET', 'OPTIONS'] },
            `${api}/users/login`,
            `${api}/users/register`,
        ]
    })
}

async function isRevoked(req, payload, done) {
    /*
    const user = await User.findById(payload.userId);
    if (!user) {
        done(null, true)
    }
     */

    if(!payload.isAdmin) {
        done(null, true)
    }
    done();
}

module.exports = authJwt