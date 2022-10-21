import express from 'express';
import { deleteAsset, getAllAssets, getAssetsAggregation, getOneAsset, postAddAsset, putUpdateAsset } from '../helper/Helper.js';

const router = express.Router();

router.get('/', async function(request, response) {
    const result = await getAllAssets(request);
    result.list.length ? response.send(result) : response.status(404).send({ message: "No Product available" });
});

router.get('/get-asset/:productID', async function(request, response) {
    const { productID } = request.params;
    const result = await getOneAsset(parseInt(productID));
    result ? response.send(result) : response.status(404).send({ message: `No Product available with Product ID ${productID}` });
});

router.put('/update-asset/:productID', async function(request, response) {
    const { productID } = request.params;
    const data = request.body;
    const result = await putUpdateAsset(parseInt(productID), data);
    result.modifiedCount > 0 ? response.status(200).send({ message: "Product updated successfully" }) : response.status(400).send({ message: "Product update failed" });
});

router.post('/add-asset', async function(request, response) {
    const data = request.body;
    const result = await postAddAsset(data);
    result.insertedId ? response.status(200).send({ message: "Product added successfully" }) : response.status(400).send({ message: "Product not added successfully" });
});

router.delete('/:productID', async function(request, response) {
    const { productID } = request.params;
    const result = await deleteAsset(parseInt(productID));
    result.deletedCount > 0 ? response.status(200).send({ message: "Product deleted successfully" }) : response.status(400).send({ message: "Failed to delete product" });
});

router.get('/assets-aggregation', async function(request, response) {
    const result = await getAssetsAggregation();
    result ? response.send(result) : response.status(404).send({ message: "Failed to fetch aggregation values" });
});



export const assetsRouter = router;
