module.exports.Icon = function(props) {
  const {
    tags,
    cid,
    id,
    vid,
    trace,
    colors,
    settings,
    isBenched,
    isFavorite,
    rebased,
    collection,
    logs,
    html,
    markup,
    name,
    created_at,
    updated_at,
    subtype,
    sub_collection,
    del_status,

} = props;
    return {
        cid,id,vid,trace,colors,isBenched,isFavorite,rebased,logs,tags,html,markup,name,subtype,collection,sub_collection,
        del_status,settings,created_at,updated_at
    }
}
/* 
    properties: {
        previews,
        viewbox,
        height,
        width,
        vbx,
        vby,
        vbh,
        vbw,
        rotation,
    }
    colors: {
        stroke,
        fill,
        markers,
        presets,
    }
    meta: {
        id,
        trace,
        cid,
        vid,
    }
    data: {
        html: {
            default,
            components
        }
        markup,
        name,
        collection,
        subtype,
    }
    status: {
        isBenched,
        isFavorite,
        logs,
    }
    tags: {
        [...tags]
        comments,
    }
*/

// module.exports.Collection = Collection;
