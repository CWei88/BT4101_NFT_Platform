const axios = require('axios')
const FormData = require('form-data')

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.REACT_APP_PINATA_API_SECRET;

export const uploadJSONToIPFS = async(JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`

    //Make axios POST to Pinata
    return axios.post(url, JSONBody, {
        headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET
        }
    }).then( (resp) => {
        return {
            success:true,
            pinataURL: "https://gateway.pinata.cloud/ipfs/" + resp.data.IpfsHash
        }
    }).catch((err) => {
        console.error(err)
        return {
            success:false,
            message:err.message
        }
    })
}

export const uploadFileToIPFS = async(file) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`

    let data = new FormData()
    data.append('file', file)

    const metadata = JSON.stringify({
        name: 'testPlatform',
        keyvalues: {
            location: 'fake'
        }
    })
    data.append('pinataMetadata', metadata)

    //Optional arguments
    const pinataOptions = JSON.stringify({
        cidVersion: 0,
    })

    data.append('pinataOptions', pinataOptions)

    return axios.post(url, data, {
        maxBodyLength: `Infinity`,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET
        }
    }).then((resp) => {
        console.log("Image uploaded at: ", resp.data.IpfsHash)
        return {
            success: true,
            pinataURL: "https://gateway.pinata.cloud/ipfs/" + resp.data.IpfsHash
        }
    }).catch((err) => {
        console.error(err)
        return {
            success: false,
            message: err.message
        }
    })
}