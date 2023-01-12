module.exports = {
    /**
     * Get
     * 
     * Returns the current time in milliseconds.
     */
    get: function (req, res) {
        res.json({ currentTimeMillis: Date.now() });
    }
}