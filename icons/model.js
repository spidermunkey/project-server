
const { MongoClient } = require('mongodb');
const { CONNECTION_STRING } = require('../.config/env.js');
const { Icon } = require('./Icon.js');
const DateTime = require('../utils/Datetime.js');
const { uuid } = require('../utils/uuid.js');
const uri = CONNECTION_STRING;
const { Preset } = require('./Preset.js');
const mongo_db = {
    uri,
    icons: {},
    collection_names: [],
    collections: {},
    meta: {},
    hasChanged: false,
    meta_alias: '{{meta}}',
    meta_doc_alias: '[[meta_document]]',

    async stat(){
        const {icons} = await this.connect();
        const meta = icons.collection('{{meta}}');
        const settings = icons.collection('{{settings}}');
        const metaData = await meta.find().toArray();
        const user_settings = await settings.find().toArray();
        const user_collections = await icons.listCollections().toArray();
        const filtered = user_collections.filter(c => c.name != '{{meta}}');
        const collections = (await Promise.all(filtered    
                  .map(async o => {
                    return {
                      name: o.name, 
                      count:(await icons.collection(c.name).stats()).count,
                      meta: metaData.find(d => d.name === o.name) || null,
                      settings: user_settings.find(d => d.name === o.name) || {},
        }})));
        const size = collections.find(o => o.name === 'all')?.count;
        return {
          size,
          collections,
          metaData,
          user_settings,
        }
    },
    async collection_data(){
        const {meta} = await this.connect();
        const metaDoc = await meta.findOne({docname: "[[collections]]"});
        const collections = metaDoc.collections;
        return {
            ...collections,
        }
    },
    async get_settings(){
        const {icons} = await this.connect();
        const meta = icons.collection('{{meta}}');
        const metaDoc = await meta.findOne({docname: "[[collections]]"});
        const {settings} = metaDoc;
        return settings; 
    },
    async save_preset( props , cid){
        const {icons} = await this.connect();
        const meta = icons.collection('{{meta}}');
        const metaDoc = await meta.findOne({docname: "[[collections]]"});
        const preset = Preset(props);
        metaDoc.settings[preset.pid] = preset;
        console.log('meta doc changed', metaDoc)
        const status = await meta.findOneAndReplace( {docname: "[[collections]]"} , metaDoc )
        return status;
    },
    async add_recent_preset(collection,preset){
        const {icons} = await this.connect();
        const meta = icons.collection(this.meta_alias);
        const updated = await meta.findOneAndUpdate({docname:this.meta_doc_alias, name:collection},{
            $push: {
                'recent_settings': {
                    $each:[preset],
                    $slice:-10
                }
            }},{returnDocument:'after'}
        )
        console.log(collection,'SETTING ADDED TO RECENT',preset,updated?.value)
        return updated.value
    },
    async delete_collection_preset(cid,pid){
        const {icons} = await this.connect()
        const meta = icons.collection(this.meta_alias)
        const collectionData = await meta.findOne({cid:cid})
        if (collectionData){
                const presetIsDefault = collectionData?.preset && collectionData.preset?.pid === pid
                let update = {
                    $unset:{ [`settings.${pid}`]: "" }
                }
                if (presetIsDefault) update.$set = { preset: {} }

                const updated = await meta.findOneAndUpdate(
                    {cid:cid},
                    update,
                    {returnDocument:'after'})
                console.log('UPDATED',updated?.value)
                if (updated) return updated.value
                else return {success:'false',message:'no action taken',reason:'no collection found'}
        }

    },
    async add_collection_preset(cid,props) {
        console.log('adding preset')
        const {icons} = await this.connect()
        const meta = icons.collection(this.meta_alias)
        const collectionData = await meta.findOne({cid:cid})
        const {preset} = props
        if (collectionData){
                const collectionName = collectionData.name
                const pid = preset.pid
                const updated = await meta.findOneAndUpdate(
                    {cid:cid},
                    {
                        $set:{[`settings.${pid}`]:preset},
                    },
                    {returnDocument:'after'})
                if (updated) {
                    const recentAppended = await this.add_recent_preset(collectionName,preset)
                    return recentAppended
                }
                else return {success:'false',message:'no action taken',reason:'no collection found'}
        }


    },
    async add_icon_preset(id,collection,setting) {
        const { icons } = await this.connect();
        const coll = icons.collection(collection);
        const original = await coll.findOne({id: id});
        const indexedOriginal = await icons.collection('all').findOne({id:id});
        const pid = setting.pid;
        const icon = await coll.findOneAndUpdate(
            { id: id }, 
            { $set: { [`settings.${pid}`]: setting }},
            {returnDocument:'after'})
       await icons.collection('all').updateOne(
        { id: id },
        { $set: { [`settings.${pid}`]: setting }})
        await this.add_recent_preset(collection,setting)
        return icon.value;
    },
    async delete_icon_preset(id,collection,pid){
        const {icons} = await this.connect()
        const coll = icons.collection(collection);
        const original = await coll.findOne({id: id})
        const presetIsDefault = original.preset?.pid === pid
        console.log('DELETING',pid,original)
        let update = {
            $unset:{ [`settings.${pid}`]: "" }
        }
        if (presetIsDefault){
            update.$set = { preset: {} }
        }
        const icon = await coll.findOneAndUpdate(
            { id: id }, 
           update,
            {returnDocument:'after'})
        await icons.collection('all').updateOne(
            { id: id },
            update)
            return icon.value;
        
    },
    async update_preset_name(props){
        const {icons} = await this.connect();
        const {name,collectionName,id,pid} = props
        const collection = icons.collection(collectionName)
        const meta = icons.collection(this.meta_alias)
        const metaDocument = await meta.findOne({docname:this.meta_doc_alias,name:collectionName})
        const icon = await collection.findOne({id:id})
        const indexedIcon = await icons.collection('all').findOne({id:id})
        console.log('REFS FOUND',metaDocument.cid,icon.id,indexedIcon.id)
        const iconSettingFound = icon.settings[pid]
        const iconSettingFound2 = indexedIcon.settings[pid]
        const collectionSettingFound = metaDocument.settings[pid]
        const recentSettingFound = metaDocument?.recent_settings.filter(s => s.pid !== pid).length > 0
        const isCollectionDefault = metaDocument?.preset.pid === pid
        const isIconDefault = icon?.preset.pid === pid
        
        let iconUpdate = { $set:{}}
        let collectionUpdate = {$set:{}}
        
        if (iconSettingFound) iconUpdate.$set[`settings.${pid}.name`] = name
        if (isIconDefault) iconUpdate.$set[`preset.name`] = name

        if (collectionSettingFound) collectionUpdate.$set[`settings.${pid}.name`] = name;
        if (recentSettingFound)
            collectionUpdate.$set[`recent_settings`] = metaDocument.recent_settings
            .map(s => {
                if (s.pid == pid)
                    s.name = name
                return s
            })
        if (isCollectionDefault) collectionUpdate.$set['preset.name'] = name
        const updatedIcon = await collection.findOneAndUpdate(
            {id:id},
            iconUpdate,
            {'returnDocument':'after'}
        )
        await icons.collection('all').findOneAndUpdate(
            {id:id},
            iconUpdate,
        )
        const updatedCollection = await meta.findOneAndUpdate(
            {docname:this.meta_doc_alias,name:collectionName},
            collectionUpdate,
            {'returnDocument':'after'}
        )
        const result = {
            iconSetting:{
                found:iconSettingFound.pid === pid,
                data: updatedIcon.value,
                updated: iconSettingFound && updatedIcon.value?.settings[pid].name == name,
                isIconDefault,
            },

            collectionSetting: {
                found: collectionSettingFound.pid === pid,
                data: updatedCollection.value,
                isCollectionDefault,
                updated: collectionSettingFound && updatedCollection.value?.settings[pid].name == name
            },
            recentSetting: {
                found: recentSettingFound,
                data:updatedCollection.value.recent_settings,
            },
        }
        console.dir(result)
        return result;
    },
    async set_default_setting(id,collection,pid){
        const { icons } = await this.connect();
        const coll = icons.collection(collection);
        const original = await coll.findOne({id: id})
        const presetId = pid
        const updateDefaultPreset = async (setting) => {
            const updated = await coll.findOneAndUpdate({ id: id }, { $set: { preset: setting }},{returnDocument:'after'})
            const updatedIndex = await icons.collection('all').updateOne({ id: id },{ $set: { preset: setting}})
            return updated.value;
        }
        let setting = original.settings[presetId]
        if (presetId === 0 || presetId === '0') // clear default initiative
            return updateDefaultPreset({})
        else if (setting)
            return updateDefaultPreset(setting)
        else
            return {success: false,message:'no action was taken',reason: 'no setting found'}
    },
    async set_collectionDefault_setting(collection,setting){
        const { icons } = await this.connect();
        const meta = icons.collection(this.meta_alias);
        const data = await meta.findOneAndUpdate({docname:this.meta_doc_alias,name: collection},
            {$set:{preset:setting}},
            {returnDocument:'after'}
        )
        if (data) return data.value
        else return {success: false,message:'no action was taken',reason: 'no setting found'}
    },
    async clear_collectionDefault_setting(collection){
        const { icons } = await this.connect();
        const meta = icons.collection(this.meta_alias);
        const data = await meta.findOneAndUpdate({docname:this.meta_doc_alias,name:collection},
            {$unset:{preset:""}},
            {returnDocument:'after'}
        )
        if (data) return data.value
        else return {success: false,message:'no action was taken',reason: 'no setting found'}
    },
    async get_collection_names() {
        const {icons} = await this.connect();
        const collections = (await icons.listCollections().toArray()).map(c => c.name).filter(name => name !== '{{meta}}');
        return collections;
    },
    async get_collection({ page = 1 , limit=350, filters = {} }, ...collection_names) {
        const { icons, meta } = await this.connect();
        const validFilters = filters?.sub_collections.length > 0  || filters?.subtypes.length > 0
        const pointer = (page-1) * parseInt(limit);
        console.log('VALID FILTERS',validFilters)
        const data = await Promise.all(collection_names.map(async name => {
            if (!(await this.check_collection_name(name))) return {};
            const collection = icons.collection(name);
            console.log('starting at: ', pointer );
            console.log('limiter : ', limit )
            console.time(`fetching collection icons ${name}` )
            let data;
            if (validFilters){
                console.log('FILTERS FOUND',filters)
                data = (await collection.find().toArray()).filter(icon => {
                    let filterSubCollection = filters?.sub_collections.length > 0;
                    let filterSubType = filters?.subtypes.length > 0;
                    let condition = false
                    if (filterSubCollection && filters?.sub_collections.includes(icon.sub_collection)){
                        condition = true;
                        if (filterSubType && !filters?.subtypes.includes(icon.subtype))
                            condition = false
                    } else if (filterSubType && filters?.subtypes.includes(icon.subtype))
                        condition = true
                    return condition
                })
            }
            else data = await collection.find().limit(parseInt(limit)).skip((parseInt(page)-1) * limit).toArray();
            console.timeEnd(`fetching collection icons ${name}`)
            console.time('fetching collection data')
            const doc = await this.get_data_by_name(name)
            console.timeEnd('fetching collection data')
            return {  meta:doc , icons: data};
        }))
        return data
        async function paginate(collection,page=1,limit=500){
            const result = await collection.aggregate([
                {
                    $facet:{
                        meta:[{$count: 'size'}],
                        icons: [{$skip:(page - 1) * limit}, {$limit: limit}]
                    }
                }
            ])
        }
    },
    async get_data(cid,type) {
        const {icons} = await this.connect();
        const meta = icons.collection(this.meta_alias);
        if (!cid){
            let docs = await meta.find({docname:this.meta_doc_alias}).toArray();
            if (type) docs = docs.filter(doc => doc.type !== type);
            return docs;
        } else {
            let doc = await meta.findOne({docname:this.meta_doc_alias})
            return doc;
        }
    },
    async get_data_by_id(cid){
        const {icons} = await this.connect();
        const meta = icons.collection(this.meta_alias);
        let doc = await meta.findOne({docname:this.meta_doc_alias,cid:cid})
        return doc
    },
    async get_data_by_name(collectionName){
        const {icons} = await this.connect();
        const meta = icons.collection(this.meta_alias);
        let doc = await meta.findOne({docname:this.meta_doc_alias, name:collectionName});
        return doc;
    },
    async get_data_formated(){
        const {icons} = await this.connect();
        const meta = icons.collection(this.meta_alias);
        const metaDocs = await meta.find({docname:this.meta_doc_alias}).toArray();
        const data = metaDocs.reduce((result,document) => {
            const collection_id = document.cid;
            switch (document.collection_type) {
                case 'project': result['projects'][collection_id] = document; break;
                case 'upload': result['uploads'][collection_id] = document; break;
                case 'auto': result['auto'][collection_id] = document; break;
                default: null
            }
            return result;
        },{                    
            uploads: {},
            projects:{},
            auto:{}
        })
        return data;
    },
    async check_collection_id(collection_id){
        const {meta} = await this.connect();
        const metaDoc = await meta.findOne({docname:'[[collections]]'});
        const idInUse = Object.hasOwn( metaDoc.collections, collection_id );
        return idInUse;
    },
    async check_collection_name(name){
        const names = await this.get_collection_names();
        return names.includes(name);
    },
    async collection_exists(name,collection_id) {
        return (await this.check_collection_name(name)) || (await this.check_collection_id(collection_id));
    },
    async find(query,collection = 'all') {
        const { icons } = await this.connect();
        const icon = await icons.collection(collection).findOne(query)
        return icon
    },
    async search(query,collection = 'all') {
        const { icons } = await this.connect();
        try {
            const result = await icons.collection(collection).find({
                $or: [
                    { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search on the 'name' field
                    { category: { $regex: query, $options: 'i' } } // Case-insensitive regex search on the 'category' field
                ]
            }).toArray();
            return result
        } catch(e){
            console.log(e)
            return false
        }
  
    },
    async sync_collection(props) {
        const isValid = await validateProperties.call(this,props);
        if (isValid.success == false) return isValid
        const sync_status = await uploadIcons.call(this,props);
        if (sync_status.success == false) return sync_status
        const meta_synced = await this.createMetaDocument(props,'upload');
        if (meta_synced.success == false) return meta_synced
        return {message: 'proccess complete', success: true, reason: {
            isValid,
            sync_status,
            meta_synced,
        }}
        async function validateProperties(props){
            const restrictedNames = ['all','favorites','recent','uploads','downloads','{{meta}}'];
            if (!props.name) return { message: 'collection not created', success: false, reason: 'invalid name property', code: 11}
            if (!props.cid) return { message: 'collection not created', success: false, reason: 'invalid collection id', code: 12}
            if (restrictedNames.includes(props.name)) return { message: 'collection not created', success: false, reason: 'restricted name'}
            if (await this.check_collection_id(props.cid)) return { message: 'collection not created', success: false, reason: 'collection id already in use', code: 14}
            if (!props.icons || !Array.isArray(props.icons)) return { message: 'collection not created', success: false, reason: 'invalid icons array'}
            console.log('check passed');
            return { success: true };
        }
        async function uploadIcons(props){
                async function upload(props){
                    const {meta,icons} = await this.connect();
                    const collection = icons.collection(props?.collection);
                    const index = icons.collection('all');
                    const iconExists = await collection.findOne({ id: props.id }) || await index.findOne({id: props.id})
                    if (!props.collection) return { message: 'upload failed', success: false, reason: 'invalid destination', code: 22}
                    if (!props.id) return {message: 'upload failed', success: false, reason: 'invalid id', code: 24}
                    if (props.markup == '') return { message: 'upload failed', success: false , reason:'invalid markup', code: 21}
                    if (iconExists) return { message: 'upload failed', success: false, reason: 'id already in use', code: 23 } 
                    const schema = new Icon({
                        ...props,
                        synced: true,
                        collection: props.collection,
                        uploaded_at: DateTime.stamp().ms,
                    })
                    const added = await collection.insertOne(schema);
                    const indexed = await index.insertOne(schema);
                    const res_1 = added?.acknowledged == true;
                    const res_2 = indexed?.acknowledged == true;
                    return {
                        message: 'process complete', 
                        success: res_1 && res_2,
                        reason: [!res_1 ? added : true, !res_2 ? indexed : true],
                        code: 0,
                    }
                }
                console.log('uploading icons', props.icons.length)
                let faulty = [];
                await Promise.all( props.icons.map(async icon => { let result = (await upload.call(this,icon)); result == false ? faulty.push(result) : null }) )
                console.log('error(s) found', faulty.length)
                return { message: 'proccess complete', success: true, reason: faulty.length };
        }
    },
    async create_collection(props = {}) {
        const {name = null} = props;
        const collection_id = props.cid = uuid();
        const restrictedNames = ['all','favorites','recent','uploads','downloads','{{meta}}'];
        const collectionExist = await this.check_collection_id(collection_id);
        if (!name) return { message: 'collection not created', success: false, reason: 'invalid name property' }
        if (collectionExist) return { message: 'collection not created',success: false, reason:'collection name exists'}
        if (restrictedNames.includes(name)) return  { message: 'collection not created',success: false, reason:'restricted collection name'}        
        const {icons} = await this.connect();
        await icons.createCollection(name);
        console.log('collection created',name);
        console.log('creating meta document');
        let faulty = [];
        if (props.icons) {
            console.log('uploading icons', props.icons.length)
            let faulty
            await Promise.all(props.icons.map(async icon => {
                 (await this.addToCollection(icon)).success == false ? faulty.push(result) : null ;
                console.log(result)
                if ( result.success == false) {
                    return { icon, result };
                }
            }))
            if (faulty.length === 1 && faulty[0] === undefined){
                console.log('creating meta document')
                this.createMetaDocument(props)
                console.log('upload process successful');
                return { message: 'success', success: true, reason: null, failed: faulty };
            }
            return { message: 'success', success: false, reason: null, failed: faulty };
        }
    },
    async createMetaDocument( props, type ) {
        const { icons } = await this.connect();
        const meta = icons.collection(this.meta_alias);
        const doc = {
            docname: this.meta_doc_alias,
            name: props.name,
            cid: props?.cid || uuid(),
            collection_type: type || 'project',
            subtypes: props?.subtypes || [],
            sub_collections: props?.sub_collections || [],
            size: props?.size || 0,
            created_at: props?.created_at || DateTime.stamp().ms,
            preset: props?.preset || null,
            usePreset: props?.usePreset || false,
            settings: props?.settings || {},
            colors: props?.colors || {}
        }
        let sampleSize = 25;
        let collection = icons.collection(props.name)
        doc.size = await collection.countDocuments();
        doc.sample = await collection.aggregate([
            { $sample: { size: sampleSize} }
            ]).toArray();
        await meta.insertOne(metaDoc);
        return doc;
    },
    async remove_collection(name){
        const {icons,meta} = await this.connect();
        const metaDoc = await meta.findOne({docname: "[[collections]]"});
        const collections = metaDoc.collections;
        const group = collections['uploads'];
        const collectionExist = this.check_collection_name(name);
        let collectionFound;
        for (const id in group){
            if (group[id].name == name){
                console.log('foundit')
                collectionFound = group[id]
                break;
            }
        }

        // if (!collectionExist)
        //     return {message: 'requested collection not found', success:false, reason: 'invalid name'}
        if (!collectionFound)
            return {message: 'requested collection not found', success: false, reason: 'meta data could not be found'}
        const cid = collectionFound?.cid;
        console.log('using ', collectionFound?.cid, ' - ', collectionFound?.name, 'to remove collection');

        try {
            console.log('dropping collection');
            // const collection = icons.collection(name).drop();
            // collection.drop();
            console.log('clearing metadata');
            delete group[cid];
            const status = await meta.findOneAndReplace({docname: "[[collections]]"},metaDoc);
            const index = icons.collection('all');
            // update index;
            for (let id in collections['auto']){
                if (collections['auto'][id].name == 'all'){
                    console.log('updating index count')
                    let manual_index = collections['auto'][id];
                    manual_index.size = await index.countDocuments();
                    manual_index.updated_on = DateTime.stamp().ms;
                    console.log('re-aggregating sample data');
                    manual_index.sample = await index.aggregate([
                        { $sample: { size: 25} }
                        ]).toArray();
                    }
            }
            return {message: 'i think i dropped it', success: true, id:cid }
        } catch(e){
            console.log(e)
            return {message: 'drop failed', success: false, reason: e}

        }

    },
    async get_random(n = 20, collection = 'all') {
        let {icons} = await this.connect()
        let sampleSize = !isNaN(n) ? Number(n) : 20
        const randomDocuments = await icons.collection(collection).aggregate([
            { $sample: { size: sampleSize} }
            ]).toArray();
        return randomDocuments;
    },
    async addToCollection(props) {
        console.log('PROPERTIES ALOT OF PROPERTIES', props)
        if (props.markup == '') 
            return { message: 'upload failed', success: false , reason:'invalid markup' }
        // if (!(await this.collection_exists(props.name,props.)) ) 
        //     return { message: 'collection no exist',success: false, reason: null}

        const db = await this.connect();
        const collection = db.icons.collection(props.collection);
        const existingDoc = await collection.findOne({ name: props.name, markup: props.markup });
        if (existingDoc) return { 
            message: `A document with the name "${props.name}" already exists.`, 
            success: false, 
            reason:'duplicate name'
        };
        // USE TRACE ID to link existing icons back to the orginial;
        if(props._id) {
            props.trace = props._id;
        }
        const schema = new Icon({
            ...props,
            // cid,
            collection: props.collection,
            created_at: DateTime.stamp(),
        })
        const result = await collection.insertOne(schema);
        if (result?.acknowledged == true)
            return { message: `icon successfully added to ${props.collection}`, success:true, result: schema};
        return { message: `error adding icon`, success:false, result: 'unknown'};
    },
    async upload(properties){
        const id = uuid();
        const entry = {
            id: properties?.id || id,
            name:properties.name,
            collection: properties.collection, 
            sub_collection: properties.sub_collection,
            markup: properties.markup, // !== ''
            subtype: properties.subtype, // null || [duotone,bold,fill,light,regular,solid,outlined,thin,medium];
            created_at: DateTime.stamp(),
        }
        let icon = new Icon(entry);
        let status1 = await this.updateIndex(icon);
        let status2 = await this.addToCollection(properties.collection,icon);
        // update meta docs
        return { 1:status1, 2:status2 };
    },
    async updateIndex(props) {
        if (props.markup == '')
            return { message: 'upload failed', success: false , reason:'invalid markup' }
        if (!(await this.collection_exists(props)) ) 
            return { message: 'collection no exist',success: false, reason: null}

        const db = await this.connect();
        const collection = db.icons.collection('all');
        const existingDoc = await collection.findOne({ name: props.name, markup: props.markup });
        if (existingDoc) return {
            message: `A document with the name "${props.name}" already exists.`, 
            success: false, 
            reason:'duplicate name'
        };
        // USE TRACE ID to link existing icons back to the orginial;
        if(props._id) {
            props.trace = props._id;
        }
        const schema = new Icon({
            ...props,
            // cid,
            collection: props.collection,
            created_at: DateTime.stamp(),
        })
        const result = await collection.insertOne(schema);
        if (result?.acknowledged == true)
            return { message: `icon successfully added to ${props.collection}`, success:true, result: schema};
        return { message: `error adding icon`, success:false, result: 'unknown'};

    },
    async ping(){
        try {
            const client = new MongoClient(this.uri);
            let conn = await Promise.race([
                new Promise((resolve,reject) => {
                    setTimeout(() => {
                        resolve(false)
                    },3000)
                }),
                client.connect(),
            ]);
            if (conn) {
                console.trace('[[ping]]',true);
                this.status = 'ready';
                client.close();
                return this.status;
            } else if (conn == false) {
                console.log('[[ping]]',' : "timeout"');
                this.status = 'offline';
                throw new Error('[[ping]]',false);
            }
            // await client.db('admin').command({ ping: 1 });
        } catch (err) {
            console.log('[[ping]]', false, err);
            return false;
        } finally {
            // await client.close();
        }
        return this.status;

    },
    async connect() {
        if (!this.client && this.hasChanged == false) {
            try {
                this.client = new MongoClient(this.uri);
                console.log('here');
                const client = await this.client.connect();
                this.status = 'ready';
                const icons = this.client.db('icons');
                const metaData = icons.collection('{{meta}}');
                const metaDocs = await metaData.find({docname: this.meta_doc_alias})
                const metaDoc = await metaData.findOne({docname: "[[collections]]"});
                const collections = metaDoc.collections;
                const settings = metaDoc.settings;
                console.log('here');
                const meta = {
                    uploads: {},
                    projects:{},
                    auto:{},
                }

                for (const collection_type in collections){
                    let category = collections[collection_type];
                    for (const collection_id in category){
                        let current = category[collection_id];
                        let collection_type = current.collection_type;
                        switch (collection_type) {
                            case 'project': meta['projects'][collection_id] = current; break;
                            case 'upload': meta['uploads'][collection_id] = current; break;
                            case 'auto': meta['auto'][collection_id] = current; break;
                            default: null
                        }
                    }
                }
                console.log('Connected to MongoDB');
                this.db = {
                    icons,
                    meta,
                    settings,
                }
                return this.db;
            } catch (error) {
                // console.error('Failed to connect to MongoDB', error);
                // use local
                console.log('db connection error',error);
                console.log('status offline')
                this.status = 'offline'
                return false;
            }
        }
        return this.db;
    },
    async disconnect() {
        if (this.client && this.client.isConnected()) {
            await this.client.close();
            console.log('Disconnected from MongoDB');
        }
    },
    async close() {
        await client.close();
        return;
    },
}

module.exports.Mongo = mongo_db;
