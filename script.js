// Simple state-machine calculator. No eval(): every calculation is done by hand.
const valueEl = document.getElementById("value");
const exprEl  = document.getElementById("expr");
const SYMBOL  = {"+":"+","-":"\u2212","*":"\u00d7","/":"\u00f7"};

let current = "0";      // number being typed (string)
let stored = null;      // left operand
let operator = null;    // pending operator
let justEvaluated = false;
let awaitingSecond = false; // true right after an operator is pressed
let error = false;

function compute(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
}
function format(n) {
  if (!isFinite(n)) return "Cannot divide by 0";
  // trim floating point noise (0.1 + 0.2 -> 0.3)
  let s = String(parseFloat(n.toPrecision(12)));
  if (s.includes("e")) return Number(s).toExponential(6);
  return s;
}
function render() {
  valueEl.textContent = current.length > 12 && !error ? Number(current).toPrecision(10).replace(/\.?0+$/, "") : current;
  valueEl.style.fontSize = error ? "1.4rem" : "";
  exprEl.textContent = stored !== null ? `${format(stored)} ${SYMBOL[operator] || ""}` : "";
  document.querySelectorAll(".op").forEach(b => b.classList.toggle("active", b.dataset.op === operator));
}
function reset() { current = "0"; stored = null; operator = null; justEvaluated = false; awaitingSecond = false; error = false; }

function inputNum(d) {
  if (error) reset();
  if (awaitingSecond) { current = "0"; awaitingSecond = false; }
  if (justEvaluated) { current = "0"; justEvaluated = false; }
  if (current === "0") current = d;
  else if (current.replace(/[-.]/g, "").length < 15) current += d;
  render();
}
function inputDot() {
  if (error) reset();
  if (awaitingSecond) { current = "0"; awaitingSecond = false; }
  if (justEvaluated) { current = "0"; justEvaluated = false; }
  if (!current.includes(".")) current += ".";
  render();
}
function chooseOp(op) {
  if (error) return;
  if (operator && !justEvaluated && stored !== null && !awaitingSecond) {
    const r = compute(stored, operator, parseFloat(current));
    if (!isFinite(r)) return showError();
    stored = r; current = format(r);
  } else {
    stored = parseFloat(current);
  }
  operator = op; awaitingSecond = true; justEvaluated = false;
  render();
}

function equals() {
  if (error || operator === null || stored === null) return;
  const b = awaitingSecond ? stored : parseFloat(current);
  const r = compute(stored, operator, b);
  if (!isFinite(r)) return showError();
  exprEl.textContent = `${format(stored)} ${SYMBOL[operator]} ${format(b)} =`;
  current = format(r); stored = null; operator = null; awaitingSecond = false; justEvaluated = true;
  valueEl.textContent = current;
  document.querySelectorAll(".op").forEach(b => b.classList.remove("active"));
}
function showError() { current = "Cannot divide by 0"; error = true; stored = null; operator = null; awaitingSecond = false; render(); }
function backspace() {
  if (error || justEvaluated || awaitingSecond) return;
  current = current.length > 1 && !(current.length === 2 && current[0] === "-") ? current.slice(0, -1) : "0";
  render();
}
function percent() { if (error) return; current = format(parseFloat(current) / 100); render(); }
function sign() { if (error || current === "0") return; current = current.startsWith("-") ? current.slice(1) : "-" + current; render(); }
function clearAll() { reset(); render(); }

// buttons
document.querySelectorAll("[data-num]").forEach(b => b.addEventListener("click", () => inputNum(b.dataset.num)));
document.querySelectorAll("[data-op]").forEach(b => b.addEventListener("click", () => chooseOp(b.dataset.op)));
const actions = {clear: clearAll, back: backspace, percent, sign, dot: inputDot, equals};
document.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => actions[b.dataset.act]()));

// keyboard support
document.addEventListener("keydown", e => {
  const k = e.key;
  let btn = null;
  if (/^[0-9]$/.test(k)) { inputNum(k); btn = document.querySelector(`[data-num="${k}"]`); }
  else if (k === ".") { inputDot(); btn = document.querySelector('[data-act="dot"]'); }
  else if ("+-*/".includes(k)) { e.preventDefault(); chooseOp(k); btn = document.querySelector(`[data-op="${k}"]`); }
  else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); btn = document.querySelector('[data-act="equals"]'); }
  else if (k === "Backspace") { backspace(); btn = document.querySelector('[data-act="back"]'); }
  else if (k === "Escape" || k === "Delete") { clearAll(); btn = document.querySelector('[data-act="clear"]'); }
  else if (k === "%") { percent(); btn = document.querySelector('[data-act="percent"]'); }
  if (btn) { btn.classList.add("press"); setTimeout(() => btn.classList.remove("press"), 110); }
});
render();
