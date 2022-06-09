const initMondayClient = require('monday-sdk-js');
//const fetch = require('node-fetch');
const axios = require('axios').default;
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const path = require('path');
const pdf2base64 = require('pdf-to-base64');

const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const mime = require('mime');


const getItemValues = async (token, itemId, boardId, intuitToken) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);

    const query = `query($itemId: [Int]) {
        items (ids: $itemId) {
          name,
          assets {
            id
            name
            public_url
          }
          column_values() {
            id
            value
            text
          }
        }
      }`;
    const variables = { itemId };
    const response = await mondayClient.api(query, { variables });

    var blankCheck = false
    if ((response.data.items[0].column_values[9].text && !response.data.items[0].column_values[6].text) || (!response.data.items[0].column_values[9].text && response.data.items[0].column_values[6].text)) {
      blankCheck = true
    }
    if ((response.data.items[0].column_values[7].text && !response.data.items[0].column_values[8].text) || (!response.data.items[0].column_values[8].text && response.data.items[0].column_values[7].text)) {

      blankCheck = true
    }

    //file download into upload folder
    if (response.data.items[0].assets.length > 0 && !blankCheck) {
      var file_value_obj = response.data.items[0].column_values[1].value;
      file_value_obj = JSON.parse(file_value_obj)
      const url = response.data.items[0].assets[0].public_url;
      const protectedFileUrl = response.data.items[0].column_values[0].text;

      console.log(url);
      var filePattern = await downloadFile(url, protectedFileUrl);

      //Generate Invoice
      //Get Customer ID to generate an invoice.

      var customerRefVal = 0;
      let customerName = response.data.items[0].column_values[9].text

      await getCustomerId(customerName, intuitToken.access_token).then(async (data) => {
        console.log(data)

        if (data.QueryResponse.Customer != undefined && data.QueryResponse.Customer.length == 1) {

          customerRefVal = data.QueryResponse.Customer[0].Id

          try {
            const QBInvoice = {
              "Line": [
                {
                  "DetailType": "SalesItemLineDetail",
                  "Description": response.data.items[0].name,
                  "Amount": +JSON.parse(response.data.items[0].column_values[6].text.replace(/[^\d.-]/g, '')),
                  "SalesItemLineDetail": {
                    "ItemRef": {
                      "name": response.data.items[0].column_values[10].text,
                      "value": response.data.items[0].column_values[11].text
                    }
                  }
                }
              ],
              "DocNumber": response.data.items[0].column_values[4].text,
              "TxnDate": response.data.items[0].column_values[3].text,
              "CustomerRef": {
                "value": customerRefVal
              },
              "CustomerMemo": {
                "value": response.data.items[0].column_values[4].text
              }
            }
            await QBinvoice(intuitToken.access_token, QBInvoice, token, boardId, itemId, filePattern, protectedFileUrl).then(async (res) => {
              debugger
              console.log(response)
              var accountRefName = ""
              var accountRefVal = 0
              if (response.data.items[0].column_values[5].text == 'Seller') {
                accountRefName = 'Commissions & fees'
                accountRefVal = 9
              }
              else {
                accountRefName = 'Commissions & fees'
                accountRefVal = 9
              }
              var vendorID = 0
              if (response.data.items[0].column_values[2].text != 'eCk') {
                //    if (JSON.parse(response.data.items[0].column_values[20].value) != null) {
                //First Vendor check if text is not there it will go in catch, If for sake i handle this with ternary operator.
                let vendorName = response.data.items[0].column_values[8].text ? response.data.items[0].column_values[8].text : ''

                await getVendorId(vendorName, intuitToken.access_token).then(async (data) => {
                  //Second check if i get it passed from the above one it will fetch all vendors as it is blank and then execute else block.
                  if ((data.QueryResponse["Vendor"] !== undefined && data.QueryResponse.Vendor.length == 1) || (!response.data.items[0].column_values[8].text && !response.data.items[0].column_values[7].text)) {
                    var isblank = false
                    var Amount = 0;
                    vendorID = response.data.items[0].column_values[8].text ? data.QueryResponse.Vendor[0].Id : 0
                    if (!response.data.items[0].column_values[8].text && !response.data.items[0].column_values[7].text) {

                      isblank = true
                      // Amount = 0
                    }
                    else {
                      isblank = false
                      // Amount = +JSON.parse(response.data.items[0].column_values[19].text.replace(/[^\d.-]/g, ''))
                    }
                    try {
                      let QBexpenseData = {
                        "AccountRef": {
                          "value": "35",
                        },
                        "PaymentMethodRef": {
                          "value": "2"
                        },
                        "PaymentType": "Check",
                        "EntityRef": {
                          "value": vendorID,
                          //"name": JSON.parse(response.data.items[0].column_values[20].value),
                          "type": "Vendor"
                        },
                        "DocNumber": response.data.items[0].column_values[4].text,
                        "PrivateNote": response.data.items[0].column_values[4].text,
                        "Line": [
                          {
                            "Description": response.data.items[0].name,
                            "Amount": response.data.items[0].column_values[7].text ? +JSON.parse(response.data.items[0].column_values[7].text.replace(/[^\d.-]/g, '')) : 0,
                            "DetailType": "AccountBasedExpenseLineDetail",
                            "AccountBasedExpenseLineDetail": {
                              "AccountRef": {
                                "name": accountRefName,
                                "value": accountRefVal
                              }

                            }
                          }
                        ]
                      }

                      await QBexpense(intuitToken.access_token, QBexpenseData, isblank).then(async () => {
                        debugger
                        // mutation for complete success
                        var value = `{\"text\":\"Success: ${new Date().toLocaleString()} : Successful.\"}`
                        var columnId = "error_no_error"
                        try {
                          const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                                                            change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                                                              id
                                                            }
                                                          }
                                                          `;
                          const variables = { boardId, columnId, itemId, value };

                          const response = await mondayClient.api(query, { variables });

                          return response;

                        } catch (err) {
                          console.error(err);
                        }
                      }).catch(async (err) => {
                        // code for unable to create an expense no 1 (for Pay to WGR Agent)
                        var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : ${err.message} - (column - Pay to WGR Agent)\"}`
                        var columnId = "error_no_error"
                        try {
                          const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                              change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                                id
                              }
                            }
                            `;
                          const variables = { boardId, columnId, itemId, value };

                          const response = await mondayClient.api(query, { variables });

                          return response;

                        } catch (err) {
                          console.error(err);
                        }
                      })
                    }
                    catch {
                      // code to thrown the syntax error in 1st expense amount column
                      var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : Syntax error in DA_Agent GCI column.\"}`
                      var columnId = "error_no_error"
                      try {
                        const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                            change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                              id
                            }
                          }
                          `;
                        const variables = { boardId, columnId, itemId, value };

                        const response = await mondayClient.api(query, { variables });

                        return response;

                      } catch (err) {
                        console.error(err);
                      }
                    }

                  }
                  else {

                    var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : No relevant vendor found in QB Account matching Pay to WGR Agent ${response.data.items[0].column_values[8].text ? response.data.items[0].column_values[20].text : 'Blank'}.\"}`
                    var columnId = "error_no_error"
                    try {
                      const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
          id
        }
      }
      `;
                      const variables = { boardId, columnId, itemId, value };

                      const response = await mondayClient.api(query, { variables });
                      return response;

                    } catch (err) {
                      console.error(err);
                    }
                  }
                }).catch(async (err) => {
                  // Server error while finding the 1st vendor
                  var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : Server error occurred while calling API to get Vendor Id for Pay to WGR Agent.\"}`
                  var columnId = "error_no_error"
                  try {
                    const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                          id
                        }
                      }
                      `;
                    const variables = { boardId, columnId, itemId, value };

                    const response = await mondayClient.api(query, { variables });
                    return response;

                  } catch (err) {
                    console.error(err);
                  }
                })

                //  }

              }
              else {
                // mutation for complete success
                var value = `{\"text\":\"Success: ${new Date().toLocaleString()} : Successful.\"}`
                var columnId = "error_no_error"
                try {
                  const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
               change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                 id
               }
             }
             `;
                  const variables = { boardId, columnId, itemId, value };

                  const response = await mondayClient.api(query, { variables });

                  return response;

                } catch (err) {
                  console.error(err);
                }
              }
            }).catch(async (err) => {

              //throw error message (mutation) for unable to create an invoice
              var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : ${err.message}\"}`
              var columnId = "error_no_error"
              try {
                const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                  change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                    id
                  }
                }
                `;
                const variables = { boardId, columnId, itemId, value };

                const response = await mondayClient.api(query, { variables });

                return response;

              } catch (err) {
                console.error(err);
              }
            })

          }
          catch (err) {
            //code to throw an error for syntax error in invoice amount column
            var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : Syntax error in DA TL Commission Due column.\"}`
            var columnId = "error_no_error"
            try {
              const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
                change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                  id
                }
              }
              `;
              const variables = { boardId, columnId, itemId, value };

              const response = await mondayClient.api(query, { variables });
              return response;

            } catch (err) {
              console.error(err);
            }
          }
        }
        else {

          // No customer found mutation
          var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : No relevant customer found in QB Account matching DA-Title Company ${response.data.items[0].column_values[31].text ? response.data.items[0].column_values[28].text : 'Blank'}\"}`
          var columnId = "error_no_error"
          try {
            const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
              change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
                id
              }
            }
            `;
            const variables = { boardId, columnId, itemId, value };

            const response = await mondayClient.api(query, { variables });

            return response;

          } catch (err) {
            console.error(err);
          }
        }
      }).catch(async () => {
        // Server error while finding the customer.

        var value = `{\"text\":\"Error: ${new Date().toLocaleString()} : Server error occurred while calling API to get customer Id for DA-Title Company.\"}`
        var columnId = "error_no_error"
        try {
          const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
            change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
              id
            }
          }
          `;
          const variables = { boardId, columnId, itemId, value };

          const response = await mondayClient.api(query, { variables });
          return response;

        } catch (err) {
          console.error(err);
        }
      })
    }
    else {

      var value = `{\"text\":\"Error: ${new Date().toLocaleString()} :  No invoice/expenses created due to lack of DA file.\"}`

      if (blankCheck) {
        value = `{\"text\":\"Error: ${new Date().toLocaleString()} :  Some of your pair is incomplete, Please check all pairings\"}`
      }
      var columnId = "error_no_error"
      try {
        const query = `mutation change_column_value($boardId: Int!, $itemId: Int!, $columnId: String!, $value: JSON!) {
          change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
            id
          }
        }
        `;
        const variables = { boardId, columnId, itemId, value };

        const response = await mondayClient.api(query, { variables });
        return response;

      } catch (err) {
        console.error(err);
      }
    }
    return true;
  } catch (err) {
    console.log(err);
  }
  return false
};


const getCustomerId = async (customerName, intuitToken) => {
  debugger
  const QBtoken = intuitToken
  var Sqlquery = `select * from Customer Where DisplayName = '${customerName}'`;
  var config = {
    method: 'post',
    url: 'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365217588430/query?minorversion=62',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/text',
      'Authorization': `Bearer ${QBtoken}`
    },
    data: Sqlquery
  };

  return await axios(config)
    .then(function (response) {
      debugger
      return response.data
    })
    .catch(function (error) {

      console.log(error.message);
    });

}
const getVendorId = async (vendorName, intuitToken) => {
  debugger
  const QBtoken = intuitToken
  var Sqlquery = `select * from vendor Where DisplayName = '${vendorName}'`;
  var config = {
    method: 'post',
    url: 'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365217588430/query?minorversion=62',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/text',
      'Authorization': `Bearer ${QBtoken}`
    },
    data: Sqlquery
  };

  return await axios(config)
    .then(function (response) {

      return response.data
    })
    .catch(function (error) {

      console.log(error);
    });

}
const QBexpense = async (intuitToken, QBexpenseData, isblank) => {


  if (isblank == false) {
    const QBtoken = intuitToken

    return await axios.post('https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365217588430/purchase?minorversion=62',
      QBexpenseData
      , {
        headers: {
          'Authorization': `Bearer ${QBtoken}`
        }
      }).then(function (response) {

        return response
        console.log(response)
      }).catch(function (err) {

        console.log(err)
        throw new Error(err.response.data.Fault.Error[0].Detail)
      })
  }
  else {
    return true
  }



}
const QBinvoice = async (intuitToken, QBInvoice, token, boardId, itemId, filePattern, protectedFileUrl) => {
  const QBtoken = intuitToken
  var protectedFileUrl = protectedFileUrl
  return await axios.post('https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365217588430/invoice?minorversion=62',
    QBInvoice
    , {
      headers: {
        'Authorization': `Bearer ${QBtoken}`
      }
    }).then(async function (response) {

      //transaction Id
      var InvoiceId = response.data.Invoice.Id;
      await postAttachmentIntuit(InvoiceId, QBtoken, filePattern, protectedFileUrl).then(data => {

        console.log(data)
      }

      ).catch(err => {

        console.log(err.response.data.Fault.Error[0].Detail)

      }

      );

      return response.data

    }).catch(function (err) {

      throw new Error(err.response.data.Fault.Error[0].Detail)
    })


}

const postAttachmentIntuit = async (TxnId, accessToken, filePattern, protectedUrl) => {

  const baseName = path.basename(protectedUrl);

  //const mimeType = 'application/pdf'
  const mimeType = mime.getType('./src/uploads/' + baseName);
  var fileName = filePattern.file_name;
  var baseFile = filePattern.base_data;

  var data = '--37a1965f87babd849241a530ad71e169\nContent-Disposition: form-data; name="file_metadata_0"\nContent-Type: application/json; charset=UTF-8\nContent-Transfer-Encoding: 8bit\n\n{\n    "AttachableRef": [\n    {\n      "EntityRef": {\n        "type": "Invoice",\n        "value": "' + TxnId + '"\n      }\n    }\n  ],\n   "FileName": "' + fileName + '",\n    "ContentType": "application/pdf"\n  }\n--37a1965f87babd849241a530ad71e169\nContent-Disposition: form-data; name="file_content_0"; filename="' + fileName + '"\nContent-Type: ' + mimeType + '\nContent-Transfer-Encoding: base64\n\n' + baseFile + '\n\n\n\n--37a1965f87babd849241a530ad71e169--';

  var config = {
    method: 'post',
    url: 'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365217588430/upload',
    headers: {
      'User-Agent': 'QBOV3-OAuth2-Postman-Collection',
      'Content-Type': 'multipart/form-data;boundary=37a1965f87babd849241a530ad71e169',
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    data: data
  };
  await axios(config)
    .then(function (response) {

      console.log(JSON.stringify(response.data));

      return JSON.stringify(response.data);

    })
    .catch(function (error) {

      console.log(error);
      return err;

    });
}

const downloadFile = async (fileUrl, protectedUrl) => {

  const fileName = path.basename(protectedUrl);
  var dir = './src/uploads/';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = './src/uploads/' + fileName;
  fs.exists(filePath, function (exists) {
    if (exists) {
      console.log('File exists. Deleting now ...');
      fs.unlinkSync(filePath);
    } else {
      console.log('File not found, so not deleting.');
    }
  });


  const request = await axios.get(fileUrl, {
    responseType: 'stream',
  });
  await pipeline(request.data, fs.createWriteStream(dir + fileName));

  var fileExension = path.extname(fileName);
  if (fileExension == 'pdf') {
    var pdfResp = await pdf2base64(dir + fileName)
      .then(
        (response) => {
          console.log(response); //cGF0aC90by9maWxlLmpwZw==
          var fileData = { 'file_name': fileName, 'base_data': response };
          return fileData;

        }
      )
      .catch(
        (error) => {
          console.log(error); //Exepection error....

        }
      )
  } else {

    const contents = fs.readFileSync(dir + fileName, { encoding: 'base64' });

    console.log(contents);

    var fileData = { 'file_name': fileName, 'base_data': contents };
    return fileData;

  }

  return pdfResp;

}

module.exports = {
  getItemValues
};
