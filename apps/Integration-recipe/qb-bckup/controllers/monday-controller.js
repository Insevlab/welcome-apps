const mondayService = require('../services/monday-service');

async function postData(req, res) {
  
  const intuitAuth = req.intuitAuth.authResponses;
  const { shortLivedToken } = req.session;
  const { payload } = req.body;
  try {
    const { inputFields } = payload;
    const { boardId, itemId } = inputFields;
    const text = await mondayService.getItemValues(shortLivedToken, itemId, boardId, intuitAuth);
    if (text != false) {
       return res.status(200).send({ message: 'success'});
    }
    else{
      return res.status(500).send({ message: 'unsuccessfull'});
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}



module.exports = {
  postData
};
