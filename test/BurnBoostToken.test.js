const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BurnBoostToken", function () {
  let BurnBoostToken;
  let burnBoostToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const TOKEN_NAME = "BurnBoost Token";
  const TOKEN_SYMBOL = "BBT";
  const INITIAL_SUPPLY = 1000000;
  const BASE_MARKET_CAP = ethers.parseEther("1000000");

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    BurnBoostToken = await ethers.getContractFactory("BurnBoostToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    burnBoostToken = await BurnBoostToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      BASE_MARKET_CAP
    );
  });

  describe("Deployment", function () {
    it("Should set the right token details", async function () {
      expect(await burnBoostToken.name()).to.equal(TOKEN_NAME);
      expect(await burnBoostToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await burnBoostToken.decimals()).to.equal(18);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await burnBoostToken.balanceOf(owner.address);
      expect(await burnBoostToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the correct initial values", async function () {
      const totalSupply = await burnBoostToken.totalSupply();
      const expectedSupply = ethers.parseEther(INITIAL_SUPPLY.toString());
      
      expect(totalSupply).to.equal(expectedSupply);
      expect(await burnBoostToken.baseMarketCap()).to.equal(BASE_MARKET_CAP);
      expect(await burnBoostToken.currentBoostMultiplier()).to.equal(10000);
      expect(await burnBoostToken.totalBurned()).to.equal(0);
    });
  });

  describe("ERC20 Functionality", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await burnBoostToken.transfer(addr1.address, transferAmount);
      expect(await burnBoostToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should allow allowances and transferFrom", async function () {
      const allowanceAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("50");

      await burnBoostToken.approve(addr1.address, allowanceAmount);
      expect(await burnBoostToken.allowance(owner.address, addr1.address)).to.equal(allowanceAmount);

      await burnBoostToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      expect(await burnBoostToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });

  describe("Burn Mechanism", function () {
    it("Should burn tokens and reduce total supply", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await burnBoostToken.totalSupply();
      
      await burnBoostToken.burn(burnAmount);
      
      const newSupply = await burnBoostToken.totalSupply();
      expect(newSupply).to.equal(initialSupply - burnAmount);
      expect(await burnBoostToken.totalBurned()).to.equal(burnAmount);
    });

    it("Should update user burned amount", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      await burnBoostToken.burn(burnAmount);
      
      expect(await burnBoostToken.userBurnedAmount(owner.address)).to.equal(burnAmount);
    });

    it("Should increment burn transaction count", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      await burnBoostToken.burn(burnAmount);
      await burnBoostToken.burn(burnAmount);
      
      expect(await burnBoostToken.burnTransactionCount()).to.equal(2);
    });

    it("Should fail when burning more than balance", async function () {
      const userBalance = await burnBoostToken.balanceOf(owner.address);
      const burnAmount = userBalance + ethers.parseEther("1");
      
      await expect(burnBoostToken.burn(burnAmount)).to.be.revertedWith("Insufficient balance to burn");
    });

    it("Should fail when burning zero amount", async function () {
      await expect(burnBoostToken.burn(0)).to.be.revertedWith("Burn amount must be greater than 0");
    });
  });

  describe("Market Cap Boost", function () {
    it("Should calculate boost correctly", async function () {
      const totalSupply = await burnBoostToken.totalSupply();
      const burnAmount = totalSupply / 10n; // Burn 10% of supply
      
      await burnBoostToken.burn(burnAmount);
      
      // 10% burned should result in 1% boost (10 * 0.1%)
      // Boost multiplier should be 10000 + 100 = 10100
      expect(await burnBoostToken.currentBoostMultiplier()).to.equal(10100);
    });

    it("Should cap boost at maximum", async function () {
      const totalSupply = await burnBoostToken.totalSupply();
      const burnAmount = totalSupply / 2n; // Burn 50% of supply
      
      await burnBoostToken.burn(burnAmount);
      
      // Should be capped at 50% boost (maximum)
      // Boost multiplier should be 10000 + 5000 = 15000
      expect(await burnBoostToken.currentBoostMultiplier()).to.equal(15000);
    });

    it("Should calculate current market cap with boost", async function () {
      const burnAmount = ethers.parseEther("10000"); // 1% of supply
      
      await burnBoostToken.burn(burnAmount);
      
      const currentMarketCap = await burnBoostToken.getCurrentMarketCap();
      const boostMultiplier = await burnBoostToken.currentBoostMultiplier();
      const expectedMarketCap = (BASE_MARKET_CAP * boostMultiplier) / 10000n;
      
      expect(currentMarketCap).to.equal(expectedMarketCap);
    });

    it("Should calculate burned percentage correctly", async function () {
      const totalSupply = await burnBoostToken.totalSupply();
      const burnAmount = totalSupply / 10n; // 10% of supply
      
      await burnBoostToken.burn(burnAmount);
      
      const burnedPercentage = await burnBoostToken.getBurnedPercentage();
      expect(burnedPercentage).to.equal(1000); // 10% = 1000 (with 2 decimal precision)
    });
  });

  describe("Statistics and Views", function () {
    it("Should return correct token stats", async function () {
      const burnAmount = ethers.parseEther("10000");
      await burnBoostToken.burn(burnAmount);
      
      const stats = await burnBoostToken.getTokenStats();
      
      expect(stats[0]).to.equal(await burnBoostToken.totalSupply() + burnAmount); // Initial supply
      expect(stats[1]).to.equal(await burnBoostToken.totalSupply()); // Current supply
      expect(stats[2]).to.equal(burnAmount); // Burned amount
      expect(stats[6]).to.equal(1); // Burn transaction count
    });

    it("Should calculate boost from potential burn", async function () {
      const burnAmount = ethers.parseEther("10000"); // 1% of supply
      
      const potentialBoost = await burnBoostToken.calculateBoostFromBurn(burnAmount);
      expect(potentialBoost).to.equal(100); // 1% burn = 0.1% boost = 100 (with precision)
    });

    it("Should return correct remaining supply percentage", async function () {
      const totalSupply = await burnBoostToken.totalSupply();
      const burnAmount = totalSupply / 10n; // 10% of supply
      
      await burnBoostToken.burn(burnAmount);
      
      const remainingPercentage = await burnBoostToken.getRemainingSupplyPercentage();
      expect(remainingPercentage).to.equal(9000); // 90% remaining = 9000 (with precision)
    });
  });

  describe("Events", function () {
    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      await expect(burnBoostToken.burn(burnAmount))
        .to.emit(burnBoostToken, "TokensBurned")
        .withArgs(owner.address, burnAmount, await burnBoostToken.currentBoostMultiplier());
    });

    it("Should emit MarketCapBoosted event when boost changes", async function () {
      const burnAmount = ethers.parseEther("10000"); // Enough to trigger boost change
      
      await expect(burnBoostToken.burn(burnAmount))
        .to.emit(burnBoostToken, "MarketCapBoosted");
    });

    it("Should emit Transfer event for burns", async function () {
      const burnAmount = ethers.parseEther("1000");
      
      await expect(burnBoostToken.burn(burnAmount))
        .to.emit(burnBoostToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, burnAmount);
    });
  });
});