pragma solidity ^0.4.17;


contract Lottery {
  address public manager;
  address[] public players;

  constructor() {
    manager = msg.sender;
  }

  function enter() public payable {
    require(msg.value > .01 ether, 'Value sent must be greater than 0.1 ether');

    players.push(msg.sender);
  }

  function random() private view returns(uint) {
      eturn uint(keccak256(block.difficulty, now, players));
  }

  function pickWinner() public restricted {
    uint index = random() % players.length;
    players[index].transfer(this.balance);
    players = new address[](0);
  }

  function getPlayers() public view returns (address[]){
    return players;
  }

  modifier restricted() {
    require(msg.sender == manager, 'Method not allowed');
    _;
  }
}

