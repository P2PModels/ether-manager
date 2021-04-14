# Ether Manager

Node.js scripts for setting up event listeners for Round Robin prototype. It 
creates `cron jobs` for reallocxation assignments among Amara linguists.

## Installation 

Ether Manager uses Infura to connect to Etherum. To run the manager it is 
required to set up an Infura project, see [here](https://blog.infura.io/getting-started-with-infura-28e41844cc89/) 

0. Install `Node.js` and `npm`, see [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. Clone the repository `git clone https://github.com/P2PModels/ether-manager.git`
2. Get into the directory `ether-manager`
3. Run `npm install` to install dependencies
4. Rename the file `.env.example` to `.env`
5. Set Infura keys and project endpoint in `.env`
6. Run `npm run start`

### Docker

1. Rename the file `.env.example` to `.env`
2. Set Infura keys and project endpoint in `.env`
4. Create container image `docker image -t ether-manager .`
5. Execute container (in background) `docker run -d ether-manager`

After starting Ether Manager listens for events emitted into the Ethereum 
rinkedby network.

## Restart contract

From time to time, it might be required to "reset" the contact state (i.e., remove 
tasks, allocations, and users). To do, execute `npm run restart-contract`. After
contract restarted, it might be needed to generate mock data, to do so run 
`npm run create-mock-data`.

## Troubleshooting

### Error 126, Permission denied

It happens when trying to run a script that does not have executable right. 
Solution assign execution permission to the script. In UNIX-based operating systems
run the command `chmod +x <script_name>`. For more information see [here](https://superuser.com/questions/1428849/npm-start-is-throwing-error-with-exit-code-126)