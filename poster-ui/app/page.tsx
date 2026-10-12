"use client";

import { useCallback, useEffect, useState } from "react";
import Web3 from "web3";

const CONTRACT_ADDRESS = "0x48F1EB9f061602fC46e8fb7f63Bb4706DE11db5D";
const DEPLOY_BLOCK = 11898642; // ваше число
const SEPOLIA_CHAIN_ID = "0xaa36a7";
const READ_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

const ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "content", type: "string" },
      { indexed: true, internalType: "string", name: "tag", type: "string" },
    ],
    name: "NewPost",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "content", type: "string" },
      { internalType: "string", name: "tag", type: "string" },
    ],
    name: "post",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

type Post = { user: string; content: string; tagHash: string; block: number };
const shortAddr = (a?: string) => (a ? a.slice(0, 7) + "..." + a.slice(-5) : "");


export default function Home() {
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [filter, setFilter] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [knownTags, setKnownTags] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  // Подключение MetaMask и переключение на Sepolia
  const handleConnect = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum;
    if (!eth) {
      setStatus("MetaMask не найден");
      return;
    }
    try {
      const [address] = await eth.request({ method: "eth_requestAccounts" });
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch {
        setStatus("Переключите MetaMask на сеть Sepolia");
      }
      setWeb3(new Web3(eth));
      setUserAddress(address);
    } catch (e) {
      setStatus("Ошибка подключения: " + (e as Error).message);
    }
  };

  // Чтение всех событий NewPost (через публичный RPC)
    const loadPosts = useCallback(async () => {
    try {
      setStatus("Загрузка постов...");
      const reader = new Web3(READ_RPC);
      const contract = new reader.eth.Contract(ABI, CONTRACT_ADDRESS);
      const latest = Number(await reader.eth.getBlockNumber()) - 3;
      const STEP = 49000;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let events: any[] = [];
      for (let from = DEPLOY_BLOCK; from <= latest; from += STEP) {
        const part = await contract.getPastEvents("NewPost", {
          fromBlock: from,
          toBlock: Math.min(from + STEP - 1, latest),
        });
        events = events.concat(part);
      }
      const list: Post[] = events.map((e) => {
        const v = e.returnValues;
        return {
          user: String(v.user),
          content: String(v.content),
          tagHash: String(v.tag).toLowerCase(),
          block: Number(e.blockNumber),
        };
      });
      setPosts(list.reverse());
      setStatus("Загружено постов: " + list.length + " (блок " + latest + ")");
    } catch (e) {
      setStatus("Не удалось прочитать посты: " + (e as Error).message);
    }
  }, []);
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Публикация поста
  const handlePost = async () => {
    if (!web3 || !userAddress) {
      setStatus("Сначала подключите кошелёк");
      return;
    }
    if (!content.trim()) {
      setStatus("Введите текст");
      return;
    }
    try {
      setStatus("Подтвердите транзакцию в MetaMask...");
      const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
      await contract.methods.post(content, tag).send({ from: userAddress });
      // запоминаем читаемый тег (в блокчейне он хранится только как хеш)
      const hash = web3.utils.keccak256(tag).toLowerCase();
      setKnownTags((k) => ({ ...k, [hash]: tag }));
      setContent("");
      setStatus("Пост опубликован");
      setTimeout(loadPosts, 3000);
    } catch (e) {
      setStatus("Ошибка: " + (e as Error).message);
    }
  };

  // Фильтр по тегу: сравниваем с keccak256 введённого тега
  const filterHash = filter.trim()
    ? new Web3().utils.keccak256(filter.trim()).toLowerCase()
    : "";
  const visible = filterHash ? posts.filter((p) => p.tagHash === filterHash) : posts;

  const tagLabel = (hash: string) => {
    if (filterHash && hash === filterHash) return filter.trim();
    return knownTags[hash] ?? hash.slice(0, 10) + "…";
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Poster</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConnect}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            {userAddress ? "Подключено" : "Connect"}
          </button>
          
        </div><address className="text-sm not-italic" title={userAddress}>
  {shortAddr(userAddress)}
</address> <address className="break-all text-sm not-italic">{userAddress}</address>

        <div className="space-y-2 rounded border p-4">
          <h2 className="font-semibold">Новый пост</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Текст"
            className="w-full rounded border bg-transparent p-2"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Тег"
            className="w-full rounded border bg-transparent p-2"
          />
          <button
            onClick={handlePost}
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Опубликовать
          </button>
        </div>

        {status && <p className="text-sm">{status}</p>}

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Фильтр по тегу (точное совпадение)"
              className="w-full rounded border bg-transparent p-2"
            />
            <button onClick={loadPosts} className="rounded border px-3">
              Обновить
            </button>
          </div>
          <p className="text-sm text-zinc-500">
            Постов: {visible.length} из {posts.length}
          </p>
          {visible.map((p, i) => (
            <div key={i} className="rounded border p-3">
              <p>{p.content}</p>
              <p className="text-sm text-zinc-500">
                Тег: {tagLabel(p.tagHash)} · Автор:{" "}
<span title={p.user}>{shortAddr(p.user)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
