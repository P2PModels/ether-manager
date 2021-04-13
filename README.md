# Ether Manager

Node.js scripts for setting up event listeners for Round Robin prototype.

It creates `cron jobs` for reallocation assignments among Amara linguists

## Start

0. Set up an Infura project, see [here](https://blog.infura.io/getting-started-with-infura-28e41844cc89/)
1. Rename the file `.env.example` to `.env`
2. Set Infura keys and project endpoint in `.env`
3. Run `npm run start`

Ether manager will listen for events triggered into the Ethereum rinkedby network.

### Docker

1. Follow steps 0 to 2 described aboved
2. Create container image `docker image -t ether-manager .`
3. Execute container (in background) `docker run -d ether-manager`