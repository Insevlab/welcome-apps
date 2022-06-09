const initMondayClient = require('monday-sdk-js');
//const fetch = require('node-fetch');
const axios = require('axios').default;
////const qs = require('qs')
//var base64 = require('base-64');
//const http = require('https'); // or 'https' for https:// URLs
//const fs = require('fs');
var monday_error = "";


const getItemValues = async (token, itemId, boardId, intuitToken) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);

    const query = `query($itemId: [Int]) {
        items (ids: $itemId) {
          name,
          column_values() {
            id
            value
            text
          }
        }
      }`;
    const variables = { itemId };
    const response = await mondayClient.api(query, { variables });
    var customerRefVal = 0;
    let customerName = response.data.items[0].column_values[30].text

    await getCustomerId(customerName, intuitToken.access_token).then(data => {

      customerRefVal = data.QueryResponse.Customer[0].Id
    })


    const QBInvoice = {
      "Line": [
        {
          "DetailType": "SalesItemLineDetail",
          "Description": response.data.items[0].name,
          "Amount": +JSON.parse(response.data.items[0].column_values[16].value),
          "SalesItemLineDetail": {
            "ItemRef": {
              "name": response.data.items[0].column_values[36].text,
              "value": response.data.items[0].column_values[37].text
            }
          }
        }
      ],
      "DocNumber": response.data.items[0].column_values[7].text,
      "TxnDate": response.data.items[0].column_values[4].text,
      "CustomerRef": {
        "value": customerRefVal
      },
      "CustomerMemo": {
        "value": response.data.items[0].column_values[7].text
      }
    }
    //var QBexpenseData = {}
    await QBinvoice(intuitToken.access_token, QBInvoice, token, boardId, itemId)
    var accountRefName = ""
    var accountRefVal = 0
    if (response.data.items[0].column_values[9].text == 'Seller') {
      accountRefName = 'Listings Sold'
      accountRefVal = 1
    }
    else {
      accountRefName = 'Sales Commission'
      accountRefVal = 43
    }
    var vendorID = 0
    if (response.data.items[0].column_values[3].text != 'eCk') {
      if (JSON.parse(response.data.items[0].column_values[19].value) != null) {
        console.log(+parseFloat(response.data.items[0].column_values[18].text.replace(/,/g, '')))
        let vendorName = response.data.items[0].column_values[19].text
        await getVendorId(vendorName, intuitToken.access_token).then(data => {
          vendorID = data.QueryResponse.Vendor[0].Id
        })

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": vendorID,
            "name": JSON.parse(response.data.items[0].column_values[19].value),
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[18].value),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
      if (JSON.parse(response.data.items[0].column_values[23].value) != null) {
        
        let vendorName = response.data.items[0].column_values[23].text
        await getVendorId(vendorName, intuitToken.access_token).then(data => {
          vendorID = data.QueryResponse.Vendor[0].Id
        })

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": vendorID,
            "name": JSON.parse(response.data.items[0].column_values[23].value),
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[22].value),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
      if (JSON.parse(response.data.items[0].column_values[25].value) != null) {
        
        let vendorName = response.data.items[0].column_values[25].text
        await getVendorId(vendorName, intuitToken.access_token).then(data => {
          vendorID = data.QueryResponse.Vendor[0].Id
        })

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": vendorID,
            "name": JSON.parse(response.data.items[0].column_values[25].value),
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[24].text),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
      if (JSON.parse(response.data.items[0].column_values[27].value) != null) {
        
        let vendorName = response.data.items[0].column_values[27].text
        await getVendorId(vendorName, intuitToken.access_token).then(data => {
          vendorID = data.QueryResponse.Vendor[0].Id
        })

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": vendorID,
            "name": JSON.parse(response.data.items[0].column_values[27].value),
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[26].text),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
      if (JSON.parse(response.data.items[0].column_values[29].value) != null) {
        
        let vendorName = response.data.items[0].column_values[29].text
        await getVendorId(vendorName, intuitToken.access_token).then(data => {
          vendorID = data.QueryResponse.Vendor[0].Id
        })

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": vendorID,
            "name": JSON.parse(response.data.items[0].column_values[29].value),
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[28].text),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
      if (JSON.parse(response.data.items[0].column_values[20].value) != null) {

        let QBexpenseData = {
          "AccountRef": {
            "value": "52",
          },
          "PaymentMethodRef": {
            "value": "4"
          },
          "PaymentType": "Cash",
          "EntityRef": {
            "value": 6,
            "name": "Jennifer Sambolin",
            "type": "Vendor"
          },
          "Line": [
            {
              "Amount": +JSON.parse(response.data.items[0].column_values[20].text),
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
        await QBexpense(intuitToken.access_token, QBexpenseData)
      }
    }

    return true;
  } catch (err) {
    console.log(err);
  }
  return false
};


const getCustomerId = async (customerName, intuitToken) => {

  const QBtoken = intuitToken
  var Sqlquery = `select * from Customer Where DisplayName Like '%${customerName}%'`;
  var config = {
    method: 'post',
    url: 'https://quickbooks.api.intuit.com/v3/company/123145771170584/query?minorversion=62',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/text',
      'Authorization': `Bearer ${QBtoken}`
    },
    data: Sqlquery
  };

  return axios(config)
    .then(function (response) {

      return response.data
    })
    .catch(function (error) {
      console.log(error.message);
    });

}
const getVendorId = async (vendorName, intuitToken) => {

  const QBtoken = intuitToken
  var Sqlquery = `select * from vendor Where DisplayName Like '%${vendorName}%'`;
  var config = {
    method: 'post',
    url: 'https://quickbooks.api.intuit.com/v3/company/123145771170584/query?minorversion=62',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/text',
      'Authorization': `Bearer ${QBtoken}`
    },
    data: Sqlquery
  };

  return axios(config)
    .then(function (response) {

      return response.data
    })
    .catch(function (error) {
      console.log(error);
    });

}
const QBexpense = async (intuitToken, QBexpenseData) => {
  
  const QBtoken = intuitToken
  await axios.post('https://quickbooks.api.intuit.com/v3/company/123145771170584/purchase?minorversion=62',
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
      return err
    })


}
const QBinvoice = async (intuitToken, QBInvoice, token, boardId, itemId) => {

  const QBtoken = intuitToken
  await axios.post('https://quickbooks.api.intuit.com/v3/company/123145771170584/invoice?minorversion=62',
    QBInvoice
    , {
      headers: {
        'Authorization': `Bearer ${QBtoken}`
      }
    }).then(function (response) {

      return response

    }).catch(function (err) {
      console.log(err.message)
      debugger

    })


};

module.exports = {
  getItemValues
};
