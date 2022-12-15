import axios from "axios"
require('dotenv').config();

const {PINATA_API_KEY, PINATA_SECRET_KEY} = process.env

class ipfsService {
    testAuth = () => {
        const url = `https://api.pinata.cloud/data/testAuthentication`;
        return axios.get(url, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        }).then(function (resp) { 
            console.log('Resp ', resp)
        }).catch(function (err) {
            console.log('error ', err)
        })
    }

    pinFiletoIPFS = async(selectedFile) => {
        console.log('UPLOADING IMAGE: ', selectedFile)
        const metadata = JSON.stringify({
            name: selectedFile.name || 'imageName',
            keyvalues: {
                accountId: '0x000'
            }
        });
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
        const formData = new FormData();
        formData.append('file', selectedFile, `${selectedFile.name}`);
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': `multipart/form-data; ; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        })
        return response;
    };
}

const IPFSService = new ipfsService();

export { IPFSService }