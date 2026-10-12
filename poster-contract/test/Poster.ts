import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { keccak256 } from "viem";

describe("Poster", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const walletClients = await viem.getWalletClients();
  const creator = walletClients[0];
  const creatorAddress = creator.account.address;

  it("post ok", async function () {
    const poster = await viem.deployContract("Poster");

    // No events before post
    const deploymentBlock = await publicClient.getBlockNumber();
    let eventsBefore = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });
    assert.deepEqual(eventsBefore, []);

    // Post
    const content = "Hello, world!";
    const tag = "hello";
    await poster.write.post([content, tag], { account: creator.account });

    // Expect one NewPost event after
    let eventsAfter = await publicClient.getContractEvents({
      address: poster.address,
      abi: poster.abi,
      eventName: "NewPost",
      fromBlock: deploymentBlock,
      strict: true,
    });
    assert.equal(eventsAfter.length, 1);
    const posted = eventsAfter[0];
    assert.equal(posted.args.user.toLowerCase(), creatorAddress.toLowerCase());
    assert.equal(posted.args.content, content);
    assert.equal(posted.args.tag, keccak256(tag));
  });
});