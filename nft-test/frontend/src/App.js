import React, { useEffect, useState } from 'react';
import getContract from './utils/useGetContracts';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { IPFSService } from './services/ipfsService'
import { CandidateCard } from "./components/CandidateCard";
import { Box, Container, Grid, Stack } from "@mui/material";

function App() {

	const [contract, setContract] = useState()
	const [selectedImage, setSelectedImage] = useState()
	const [candidates, setCandidates] = useState([])
	const [candidatefromData, setcandidateFromData] = useState({'name': '', 'imageHash': ''})
	const contractAddress = '0x971D189Af70185014808678A5613369fe3054Ffe'

	async function getAllCandidates() {
		const retrievedCandidates = await contract.fetchCandidates();
		const arr = []

		retrievedCandidates.forEach(candidate => {
			arr.push({
				id: candidate.id,
				name: candidate.name,
				totalVotes: candidate.totalVotes,
				imageHash: candidate.imageHash,
				candidateAddress: candidate.candidateAddress
			})
		})

		setCandidates(arr)
	}

	useEffect(() => {
		setContract(getContract(contractAddress))
		IPFSService.testAuthentication();
	}, [])

	useEffect(() => {
		if (contract) {
			contract.on("Voted", async function() {
				getAllCandidates();
			})
			contract.on("candidateCreated", async function() {
				getAllCandidates();
			})
		}
	}, [contract])

	const IPFSUploadHandler = new  Promise(() => {
		const resp = IPFSService.pinFileToIPFS(selectedImage);
		if (!resp.data.IpfsHash) {
			throw Error("No IPFS Hash")
		} else {
			return `https://gateway.pinata.cloud/ipfs/${resp.data.IpfsHash}`
		}
	})

	async function registerCandidate() {
		const name = candidatefromData.name;
		const ipfsImageHash = await IPFSUploadHandler();
		contract.registerCandidate(name, ipfsImageHash);
		contract.on('candidateCreated', async function(event) {
			getAllCandidates()
		})
	}



	function vote(address) {
		if (!address) {
			throw Error("no address defined")
		}
		contract.vote(address)
		contract.on("Voted", function (event) { 
			getAllCandidates();
		})
	}

	const handleChange = function (event) {
		setcandidateFromData( function (prevState) {
			return {
				prevState,
				[event.target.name]: event.target.value
			}
		});
	}

	return ( 
		<>
			<Container  maxWidth="md" sx={{marginY: "2rem" }}>
    			<Box component="form">
        			<Stack  direction="row"  alignItems="center"  spacing={2}  mb={4}>
            			<TextField  id="filled-basic"       
            				label="Name"  variant="filled"
                			name="name"
							value={candidatefromData.name}   
							onChange={handleChange}  />
							<label  htmlFor="contained-button-file">
							<input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target?.files[0])} />
						</label>

						<Button  variant="contained"  component="span" 
						onClick={() => registerCandidate()}>    
							Register as Candidate  
						</Button>
					</Stack>
				</Box>
			</Container>
			
			{candidates.length > 0 && (<Container sx={{ bgcolor: "#F0F3F7" }}>
                <Box sx={{ flexGrow: 1, paddingY: "3rem", paddingX: "2rem" }}>
                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                        {
                            candidates.map((candidate, index) =>
                                <Grid item sm={4} key={index}>
                                    <CandidateCard candidate={candidate} vote={vote} />
                                </Grid>)
                        }
                    </Grid>
                </Box>
            </Container>)}

		</>
	)
}	

export default App;