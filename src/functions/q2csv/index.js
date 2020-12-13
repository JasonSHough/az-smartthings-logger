module.exports = async function (context, req) {
    context.log(`input is ${JSON.stringify(req)}`)
    // context.bindings.storage = JSON.stringify(req);
    context.done();
};