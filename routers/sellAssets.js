import express from "express";
import {
  deleteSoldAsset,
  getAllSoldAssets,
  getOneAsset,
//   getOneSoldAsset,
  getOneSoldAssetByOid,
  getSoldAssetsAggregation,
  postSoldAssets,
  putUpdateAsset,
} from "../helper/Helper.js";

const router = express.Router();

router.get("/", async function (request, response) {
  let result = await getAllSoldAssets(request);
  result.list = await getDetails(result.list);
  result.list.length
    ? response.send(result)
    : response.status(404).send({ message: "No record available" });
});

// router.get("/get-sold-asset/:productID", async function (request, response) {
//   const { productID } = request.params;
//   let result = await getOneSoldAsset(parseInt(productID), request);
//   result.list = await getDetails(result.list);
//   result.list.length
//     ? response.send(result)
//     : response.status(404).send({
//         message: `No Sold Product record available for Product ID ${productID}`,
//       });
// });

router.post("/", async function (request, response) {
  const data = request.body;
  const result = await postSoldAssets(data);
  if (result.insertedCount === data.length) {
    let modifiedCnt = 0;
    let matchedCnt = 0;
    data.map(async (item) => {
      const { productID, soldQty } = item;
      const asset = await getOneAsset(parseInt(productID));

      const { inStockQty } = asset;
      let updatedQty = inStockQty - soldQty;
      const updateAsset = await putUpdateAsset(productID, {
        inStockQty: updatedQty,
      });

      modifiedCnt += updateAsset.modifiedCount;
      matchedCnt += updateAsset.matchedCount;
    });
    modifiedCnt === matchedCnt
      ? response.status(200).send({ message: "Products sold successfully" })
      : response.status(400).send({
          message: "Products not sold successfully. Kindly check database.",
        });
  } else {
    response.status(400).send({
      message: "Products not sold successfully. Kindly check database.",
    });
  }
});

// ----####----
// router.get("/oid/:_id", async function (request, response) {
//   const { _id } = request.params;
//   const result = await getOneSoldAssetByOid(_id);
//   result
//     ? response.send(result)
//     : response
//         .status(404)
//         .send({
//           message: `No Sold Product data available for Product ID ${_id}`,
//         });
// });
// ----####----

router.delete("/:_id", async function (request, response) {
  const { _id } = request.params;
  const oidresult = await getOneSoldAssetByOid(_id);
  if (oidresult) {
    const result = await deleteSoldAsset(_id);
    if (result.deletedCount > 0) {
      const { productID, soldQty } = oidresult;
      const asset = await getOneAsset(parseInt(productID));

      if(asset){
        const { inStockQty } = asset;
      const updatedQty = inStockQty + soldQty;
      const updateAsset = await putUpdateAsset(productID, {
        inStockQty: updatedQty,
      });

      updateAsset.modifiedCount === 1 && updateAsset.matchedCount === 1
        ? response
            .status(200)
            .send({ message: "Sell Record deleted successfully" })
        : response
            .status(400)
            .send({ message: "Failed to delete sell record" });
      } else {
        response
            .status(200)
            .send({ message: "Sell Record deleted successfully. Product not found in stock or removed from stock." })
      }
      
    } else {
      response.status(400).send({ message: "Failed to delete sell record" });
    }
  } else {
    response.status(400).send({ message: "Failed to delete sell record" });
  }
});

router.get('/sold-assets-aggregation', async function(request, response) {
    const result = await getSoldAssetsAggregation(request);
    result.totalSold[0].count ? response.send(result) : response.status(404).send({ message: "No sell record available" });
});

async function getDetails(list) {
  let temp = {};
  for (let i = 0; i < list.length; i++) {
    temp = await getOneAsset(list[i].productID);
    list[i]["name"] = temp.name;
    list[i]["brand"] = temp.brand;
    list[i]["gender"] = temp.gender;
    list[i]["size"] = temp.size;
  }
  return list;
}

export const sellAssetsRouter = router;
