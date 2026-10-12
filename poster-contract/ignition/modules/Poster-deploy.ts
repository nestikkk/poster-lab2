import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PosterModule", (m) => {
  const poster = m.contract("Poster");

  return { poster };
});