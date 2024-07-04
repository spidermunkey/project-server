const model = require('../../models/icons/model')

module.exports = {
    async getKnownCategories(conn) {
        const names = await model.getCategories();
        return names;
    },
    
    async getRandom(n,collection) {
        const icons = await model.getRandom(n,collection)
        return icons
    },
    
    async search(query) {

        const icons = await model.search(query);
        if (icons)
            icons.map(icon => {
                const matchedField = icon.name.match(new RegExp(query, 'i')) ? 'name' : 'category';
                return { ...icon, matchedField };
            });
        return icons
    },
    
    async getIconById(id) {
        const icon = await model.getByID(id);
        return icon
    },
    async getKnownCollections(conn) {
        const names = await model.getCollections();
        return names;
    },
    
    async getAllStandardIcons() {
        const icons = await model.getAllStandardIcons();
        return icons;
    },
    
    async getCategoryByName(cName) {
        const icons = await model.getCategoryByName(cName)
        if (icons)
            return icons;
        else
            return 'nothing to see here'
    },
    
    async getCollectionByName(cName) {
        const icons = await model.getCollectionByName(cName)
        if (icons) return icons;
        else return 'nothing to see here'
    },
    
    async addToCollection(name,data) {
        const result = await model.addToCollection(name,data)
        return result;
    },
    
    async logFavorite(props) {
        const result = await model.logFavorite(props);
        return result;
    },

    async createCollection(name) {
        const result = await model.createCollection(name)
        return result;
    },
    
}
