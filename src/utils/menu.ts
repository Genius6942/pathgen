const menuContainer = document.querySelector("#menu") as HTMLDivElement;

let menuOpen = 0;
const hideMenu = () => {
	if (performance.now() - menuOpen < 100) return;
  menuContainer.classList.remove("flex");
  menuContainer.classList.add("hidden");
  menuContainer.innerHTML = "";
};

export interface MenuItem {
  label: string;
  action: () => void;
}

export const showMenu = (menu: MenuItem[], location: { x: number; y: number }) => {
  hideMenu();
	menuOpen = performance.now();
  menuContainer.classList.add("flex");
  menuContainer.classList.remove("hidden");

  menu.forEach((item) => {
    const button = document.createElement("button");
    button.textContent = item.label;
    button.addEventListener(
      "click",
      () => {
        hideMenu();
        item.action();
      },
      { capture: true }
    );
    button.classList.add("menuitem");
    menuContainer.appendChild(button);
  });

  menuContainer.style.left = `${location.x}px`;
  menuContainer.style.top = `${location.y}px`;
};

window.addEventListener("click", hideMenu);

window.addEventListener("keydown", (e) => {
	if (e.key.toLowerCase() === "escape") hideMenu();
});

