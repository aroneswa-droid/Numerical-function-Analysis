const cardPool = [
  { src: "card1.jpg", count: 3, scale: 0.4, x: 0, y: 0 },
  { src: "card2.jpg", count: 5, scale: 0.1, x: 5, y: -10 },
  { src: "card3.jpg", count: 2, scale: 0.1, x: -8, y: 0 },
  { src: "card4.jpg", count: 4, scale: 0.1, x: 0, y: 5 }
];

// 手札の上限枚数（場に出す効果などで将来増減させる想定の専用変数）
let maxHandSize = 6;

let draggingIndex = -1;
let hoverIndex = -1;
let draggingInsideHand = false;
// cardPool と同じ形式のdeck設定
const deckVisual = { scale: 0.4, x: 0, y: 0 };

const handElement = document.getElementById("hand");
const deckElement = document.getElementById("deck");
const deckImg = document.querySelector("#deck img");

const W = 800;
const C = 120;

/* --------------------------
   デッキ生成
-------------------------- */
function createDeck(pool) {
  const deck = [];

  pool.forEach(({ src, count, scale, x, y }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        src,
        scale,
        x,
        y
      });
    }
  });

  return shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [array[i], array[r]] = [array[r], array[i]];
  }
  return array;
}

const deck = createDeck(cardPool);

/* --------------------------
   deck表示
-------------------------- */
function updateDeckVisual() {
  const { scale, x, y } = deckVisual;

  deckImg.style.setProperty("--img-scale", scale);
  deckImg.style.setProperty("--img-x", `${x}px`);
  deckImg.style.setProperty("--img-y", `${y}px`);
}

updateDeckVisual();

/* --------------------------
   カード生成
-------------------------- */
function createCard(cardData) {
  const div = document.createElement("div");
  div.classList.add("card");

  const frame = document.createElement("div");
  frame.classList.add("card-image");

  const img = document.createElement("img");
  img.src = cardData.src;

  // ここが抜けていた部分：カードごとの画像調整をCSS変数に反映
  img.style.setProperty("--img-scale", cardData.scale ?? 1);
  img.style.setProperty("--img-x", `${cardData.x ?? 0}px`);
  img.style.setProperty("--img-y", `${cardData.y ?? 0}px`);

  frame.appendChild(img);
  div.appendChild(frame);

  div.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const cards = Array.from(handElement.children);
    draggingIndex = cards.indexOf(div);

    div.style.transition = "none";
    div.style.zIndex = 10;

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDrop);
  });

  return div;
}

const boardElement = document.getElementById("board");

/* --------------------------
   場に出す処理
-------------------------- */
function playCardToBoard(cardElement, cardData) {
  // 専用イベントを発火（将来ここに効果処理などを足していく想定）
  const event = new CustomEvent("cardplayed", {
    detail: { cardData }
  });
  document.dispatchEvent(event);

  // 現状はカードが消失するだけ
  cardElement.remove();
}

// 今のところ「消える」だけの処理をリスナーとして登録
document.addEventListener("cardplayed", (e) => {
  // 将来ここでカード効果・盤面追加・maxHandSize変更などを行う
});

/* --------------------------
   手札レイアウト
-------------------------- */
function updateHand() {
  const cards = Array.from(handElement.children);
  const visible = cards.filter((_, i) => i !== draggingIndex);

  const slotCount =
    draggingIndex === -1
      ? cards.length
      : draggingInsideHand
        ? cards.length
        : cards.length - 1;

  if (slotCount <= 0) return;

  const gap = (W - slotCount * C) / (slotCount + 1);

  let slot = 0;

  visible.forEach((card) => {
    if (draggingInsideHand && slot === hoverIndex) slot++;

    const x = gap + slot * (C + gap);

    card.style.transform = `translateX(${x}px)`;
    card.style.zIndex = 1;
console.log(slotCount);
    slot++;
  });
}

/* --------------------------
   ドラッグ処理
-------------------------- */
function onDrag(e) {
  const cards = Array.from(handElement.children);
  const card = cards[draggingIndex];
  if (!card) return;

  const rect = handElement.getBoundingClientRect();
  const boardRect = boardElement.getBoundingClientRect();

  const x = e.clientX - rect.left - 60;
  const y = e.clientY - rect.top - 80;

  card.style.transform = `translate(${x}px, ${y}px)`;

  const insideBoard =
    e.clientX >= boardRect.left &&
    e.clientX <= boardRect.right &&
    e.clientY >= boardRect.top &&
    e.clientY <= boardRect.bottom;

  const inside =
    !insideBoard &&
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  draggingInsideHand = inside;

  if (!inside) {
    hoverIndex = -1;
    updateHand();
    return;
  }

  const slotCount = cards.length;
  const gap = (W - slotCount * C) / (slotCount + 1);

  const slots = Array.from({ length: slotCount }, (_, i) =>
    gap + i * (C + gap)
  );

  const centerX = x + C / 2;

  hoverIndex = slots.reduce(
    (best, slotX, i) => {
      const dist = Math.abs(centerX - (slotX + C / 2));
      return dist < best.dist ? { index: i, dist } : best;
    },
    { index: 0, dist: Infinity }
  ).index;

  updateHand();
}

/* --------------------------
   ドロップ
-------------------------- */
function onDrop(e) {
  const cards = Array.from(handElement.children);
  const moved = cards[draggingIndex];
  const movedData = moved._cardData; // 後述：createCardでセットする必要あり

  const rect = handElement.getBoundingClientRect();
  const boardRect = boardElement.getBoundingClientRect();

  const insideBoard =
    e.clientX >= boardRect.left &&
    e.clientX <= boardRect.right &&
    e.clientY >= boardRect.top &&
    e.clientY <= boardRect.bottom;

  const inside =
    !insideBoard &&
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  document.querySelectorAll(".card").forEach(c => {
    c.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
  });

  if (insideBoard) {
    playCardToBoard(moved, movedData);
  } else if (inside) {
    const order = cards.filter((_, i) => i !== draggingIndex);
    const index = Math.max(0, Math.min(hoverIndex, order.length));
    order.splice(index, 0, moved);

    handElement.innerHTML = "";
    order.forEach(c => handElement.appendChild(c));
  }

  draggingIndex = -1;
  hoverIndex = -1;
  draggingInsideHand = false;

  requestAnimationFrame(updateHand);

  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", onDrop);
}

/* --------------------------
   ドロー
-------------------------- */
deckElement.addEventListener("click", () => {
  if (deck.length === 0) return;

  // 手札が上限に達している場合はドローできない
  if (handElement.children.length >= maxHandSize) return;

  const cardData = deck.pop();
  const card = createCard(cardData);

  const d = deckElement.getBoundingClientRect();
  const h = handElement.getBoundingClientRect();

  const startX = d.left - h.left;
  const startY = d.top - h.top;

  card.style.transform = `translate(${startX}px, ${startY}px)`;

  handElement.appendChild(card);

  requestAnimationFrame(updateHand);
});