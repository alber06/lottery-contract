const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()
   
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' })

   lottery.setProvider(provider);
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('has a manager associated', async () => {
    const manager = await lottery.methods.manager().call()
    assert.equal(manager, accounts[0]);
  });

  it('allows one player to enter', async () => {
    await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });
    const players = await lottery.methods.getPlayers().call();

    assert.equal(players.length, 1);
    assert.equal(players[0], accounts[1]);
  });

  it('allows multiple players', async () => {
    await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.02', 'ether') });
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') });

    const players = await lottery.methods.getPlayers().call();

    assert.equal(players.length, 2);
    assert.equal(players[0], accounts[1]);
    assert.equal(players[1], accounts[0]);

  });

  it('fails if no money is sent', async () => {
    try {
      await lottery.methods.enter().send({ from: accounts[1] });
      assert(false);
    } catch (e) {
      assert(e); 
    }
  });

  it('fails if another person than the manager tries to pick the winner', async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] })
      assert(false)
    } catch (e) {
      assert(e)
    }
  })

  it('sends money to the winner and resets the players array', async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether') });
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const balance = await web3.eth.getBalance(accounts[0]);

    const difference = balance - initialBalance;
    const players = await lottery.methods.getPlayers().call();

    assert(difference > web3.utils.toWei('1.8', 'ether'));
    assert.equal(players.length, 0);

    const lotteryBalance = await web3.eth.getBalance(lottery.options.address);
    assert.equal(lotteryBalance, 0);
  })
})