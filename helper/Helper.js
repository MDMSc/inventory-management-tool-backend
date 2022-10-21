import { client } from '../index.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import moment from 'moment';

// ---------------------USER------------------------
export async function getHashedPassword(password){
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(password, salt);
    return hashedPw;
}
export async function getUsers(username){
    return await client.db("asset_management").collection("users").findOne({username: username});
}
export async function postUser(user){
    return await client.db("asset_management").collection("users").insertOne(user);
}
// export async function deleteUser(_id){
//     const oid = ObjectId(_id);
//     return await client.db("asset_management").collection("users").deleteOne({ _id: oid });
// }
// export async function putUpdateUser(_id, data){
//     const oid = ObjectId(_id);
//     // data["updatedAt"] = new Date();
//     return await client.db("asset_management").collection("users").updateOne({ _id: oid }, { $set: data });
// }


// ---------------------ASSETS------------------------
export async function getAllAssets(request){
    let sort = "";
    let query = {};
    let results = {};
    let limit = 0;
    let startIndex = 0;
    let endIndex = 0;

    if(request.query.type){
        query.type = request.query.type;
    }
    if(request.query.brand){
        query.brand = request.query.brand;
    }
    if(request.query.search){
        query.$or = [
            { 'name': { $regex: request.query.search, $options: 'i' } },
            { 'productID': parseInt(request.query.search) }
        ]
    }

    results.productCount = await client.db("asset_management").collection("assets").aggregate([
        {
            '$match': query
        },
        {
          '$count': 'count'
        }
      ]).toArray();
    
    if(request.query.page){
        limit = 5;
        const page = parseInt(request.query.page);
        delete request.query.page;

        startIndex = (page - 1) * limit;
        endIndex = page * limit;
        results.pagesCount = Math.ceil(results.productCount[0].count / limit);

        if(endIndex < results.productCount[0].count){
            results.next = {
                page: page + 1,
                limit: limit 
            }
        }
        if(startIndex > 0){
            results.prev = {
                page: page - 1,
                limit: limit 
            }
        }
    }

    if(request.query.sort){
        sort = request.query.sort;
        delete request.query.sort;
    }

    if(sort === "price-asc"){
        results.list = await client.db("asset_management").collection("assets").find(query).sort({ price: 1 }).limit(limit).skip(startIndex).toArray();
    } else if(sort === "price-desc"){
        results.list = await client.db("asset_management").collection("assets").find(query).sort({ price: -1 }).limit(limit).skip(startIndex).toArray();
    }
    else {
        results.list = await client.db("asset_management").collection("assets").find(query).limit(limit).skip(startIndex).toArray();
    }
    return results;
}
export async function getOneAsset(pid){
    return await client.db("asset_management").collection("assets").findOne({ productID: pid });
}
export async function putUpdateAsset(pid, data){
    data["updatedAt"] = moment().format();
    return await client.db("asset_management").collection("assets").updateOne({ productID: pid }, { $set: data });
}
export async function postAddAsset(data){
    data["createdAt"] = moment().format();
    data["updatedAt"] = moment().format();
    return await client.db("asset_management").collection("assets").insertOne(data);
}
export async function deleteAsset(pid){
    return await client.db("asset_management").collection("assets").deleteOne({ productID: pid });
}

export async function getAssetsAggregation(){
    // AGGREGATED VALUES
    const totalInStockQty = await client.db("asset_management").collection("assets").aggregate([
        {
          '$match': {
            'inStockQty': {
              '$gt': 5
            }
          }
        }, {
          '$group': {
            '_id': 'totalinStockQty', 
            'count': {
              '$sum': 1
            }
          }
        }
      ]).toArray();
    const totalLowStockQty = await client.db("asset_management").collection("assets").aggregate([
              {
                '$match': {
                  '$and': [
                    {
                      'inStockQty': {
                        '$gt': 0
                      }
                    }, {
                      'inStockQty': {
                        '$lte': 5
                      }
                    }
                  ]
                }
              }, {
                '$group': {
                  '_id': 'totalLowStockQty', 
                  'count': {
                    '$sum': 1
                  }
                }
              }
            ]).toArray();
    const totalOutStockQty = await client.db("asset_management").collection("assets").aggregate([
              {
                '$match': {
                  'inStockQty': 0
                }
              }, {
                '$group': {
                  '_id': 'totalOutStockQty', 
                  'count': {
                    '$sum': 1
                  }
                }
              }
            ]).toArray();
    const totalInStockAmt = await client.db("asset_management").collection("assets").aggregate([
              {
                '$match': {
                  'inStockQty': {
                    '$gt': 0
                  }
                }
              }, {
                '$group': {
                  '_id': 'totalInStockAmt', 
                  'totalAmount': {
                    '$sum': {
                      '$multiply': [
                        '$price', '$inStockQty'
                      ]
                    }
                  }
                }
              }
            ]).toArray();
    const inStockQtyByType = await client.db("asset_management").collection("assets").aggregate([
              {
                '$group': {
                  '_id': '$type', 
                  'count': {
                      '$sum': "$inStockQty"
                  }
                }
              }
            ]).toArray();

    return {totalInStockQty, totalLowStockQty, totalOutStockQty, totalInStockAmt, inStockQtyByType} ;
}


// ---------------------SOLD ASSETS------------------------
export async function getAllSoldAssets(request){
    let sort = "";
    let results = {};
    let query = {};
    let limit = 0;
    let startIndex = 0;
    let endIndex = 0;

    if(request.query.search){
        query.$or = [
            { 'type': request.query.search },
            { 'productID': parseInt(request.query.search) }
        ]
    }

    results.productCount = await client.db("asset_management").collection("sold_assets").aggregate([
        {
            '$match': query
        },
        {
          '$count': 'count'
        }
      ]).toArray();
    
    if(request.query.page){
        limit = 5;
        const page = parseInt(request.query.page);
        delete request.query.page;

        startIndex = (page - 1) * limit;
        endIndex = page * limit;
        results.pagesCount = Math.ceil(results.productCount[0].count / limit);

        if(endIndex < results.productCount[0].count){
            results.next = {
                page: page + 1,
                limit: limit 
            }
        }
        if(startIndex > 0){
            results.prev = {
                page: page - 1,
                limit: limit 
            }
        }
    }

    if(request.query.sort){
        sort = request.query.sort;
        delete request.query.sort;
    }

    if(sort === "date-asc"){
        results.list = await client.db("asset_management").collection("sold_assets").find(query).sort({ createdAt: 1 }).limit(limit).skip(startIndex).toArray();
    } else if(sort === "date-desc"){
        results.list = await client.db("asset_management").collection("sold_assets").find(query).sort({ createdAt: -1 }).limit(limit).skip(startIndex).toArray();
    } else if(sort === "amount-asc"){
        results.list = await client.db("asset_management").collection("sold_assets").find(query).sort({ amount: 1, createdAt: 1 }).limit(limit).skip(startIndex).toArray();
    } else if(sort === "amount-desc"){
        results.list = await client.db("asset_management").collection("sold_assets").find(query).sort({ amount: -1, createdAt: -1 }).limit(limit).skip(startIndex).toArray();
    }
    else {
        results.list = await client.db("asset_management").collection("sold_assets").find(query).limit(limit).skip(startIndex).toArray();
    }

    return results;
};

// export async function getOneSoldAsset(pid, request){
//     let sort = "";
//     let results = {};
//     let limit = 0;
//     let startIndex = 0;
//     let endIndex = 0;

//     results.productCount = await client.db("asset_management").collection("sold_assets").aggregate([
//         {
//             '$match': {
//               'productID': pid
//             }
//           }, {
//           '$count': 'count'
//         }
//       ]).toArray();
    
//     if(request.query.page){
//         limit = 5;
//         const page = parseInt(request.query.page);
//         delete request.query.page;

//         startIndex = (page - 1) * limit;
//         endIndex = page * limit;
//         results.pagesCount = Math.ceil(results.productCount[0].count / limit);

//         if(endIndex < results.productCount[0].count){
//             results.next = {
//                 page: page + 1,
//                 limit: limit 
//             }
//         }
//         if(startIndex > 0){
//             results.prev = {
//                 page: page - 1,
//                 limit: limit 
//             }
//         }
//     }

//     if(request.query.sort){
//         sort = request.query.sort;
//         delete request.query.sort;
//     }

//     if(sort === "date-asc"){
//         results.list = await client.db("asset_management").collection("sold_assets").find({ productID : pid }).sort({ createdAt: 1 }).limit(limit).skip(startIndex).toArray();
//     } else if(sort === "date-desc"){
//         results.list = await client.db("asset_management").collection("sold_assets").find({ productID : pid }).sort({ createdAt: -1 }).limit(limit).skip(startIndex).toArray();
//     } else if(sort === "amount-asc"){
//         results.list = await client.db("asset_management").collection("sold_assets").find({ productID : pid }).sort({ amount: 1, createdAt: 1 }).limit(limit).skip(startIndex).toArray();
//     } else if(sort === "amount-desc"){
//         results.list = await client.db("asset_management").collection("sold_assets").find({ productID : pid }).sort({ amount: -1, createdAt: -1 }).limit(limit).skip(startIndex).toArray();
//     }
//     else {
//         results.list = await client.db("asset_management").collection("sold_assets").find({ productID : pid }).toArray();
//     }

//     // AGGREGATED VALUES
//     results.totalSold = await client.db("asset_management").collection("sold_assets").aggregate([
//         {
//           '$match': {
//             'productID': pid
//           }
//         }, {
//           '$group': {
//             '_id': 'totalSold', 
//             'count': {
//               '$sum': '$soldQty'
//             },
//             'totalAmount': {
//                 '$sum': '$amount'
//             }
//           }
//         }
//       ]).toArray();

//       return results;
// };

export async function postSoldAssets(data){
    data.map(item => {
        item["createdAt"] = moment().format();
        item["year"] = moment().format('YYYY');
        item["month"] = moment().format('MM');
    });
    return await client.db("asset_management").collection("sold_assets").insertMany(data);
};

export async function deleteSoldAsset(_id){
    const oid = ObjectId(_id);
    return await client.db("asset_management").collection("sold_assets").deleteOne({ _id: oid });
};

export async function getOneSoldAssetByOid(_id){
    const oid = ObjectId(_id);
    return await client.db("asset_management").collection("sold_assets").findOne({ _id: oid });
};

export async function getSoldAssetsAggregation(request){
    // AGGREGATED VALUES
    const totalSold = await client.db("asset_management").collection("sold_assets").aggregate([
        {
          '$group': {
            '_id': 'totalSold', 
            'count': {
              '$sum': '$soldQty'
            },
            'totalAmount': {
                '$sum': '$amount'
            }
          }
        }
      ]).toArray();
    const soldStockQtyByType = await client.db("asset_management").collection("sold_assets").aggregate([
        {
          '$group': {
            '_id': '$type', 
            'count': {
              '$sum': "$soldQty"
            }
          }
        }
      ]).toArray();
    const totalSellByYear = await client.db("asset_management").collection("sold_assets").aggregate([
        {
          '$group': {
            '_id': '$year', 
            'count': {
              '$sum': '$soldQty'
            },
            'amount': {
                '$sum': '$amount'
            }
          }
        }
      ]).toArray();

    let totalSellByMonth = [];
    if(request.query.year){
        totalSellByMonth = await client.db("asset_management").collection("sold_assets").aggregate([
            {
            '$match': {
                'year': request.query.year
            }
            }, {
            '$group': {
                '_id': '$month', 
                'count': {
                '$sum': '$soldQty'
                }, 
                'amount': {
                '$sum': '$amount'
                }
            }
            }
        ]).toArray();
    } else {
        totalSellByMonth.push({message: "Specify a year to get sales record by month"});
    }

    return {totalSold, soldStockQtyByType, totalSellByYear, totalSellByMonth};
}


