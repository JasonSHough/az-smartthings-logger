module.exports = async function (context, req) {
    context.log(`input is ${JSON.stringify(req)}`)
    context.bindings.outputdoc = JSON.stringify(req);
    context.done();
};