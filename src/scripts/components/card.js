const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

const isCardLiked = (likes, userId) =>
  likes.some((user) => user._id === userId);

export const updateLikeView = (cardElement, likes, userId) => {
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCount = cardElement.querySelector(".card__like-count");

  likeButton.classList.toggle("card__like-button_is-active", isCardLiked(likes, userId));
  likeCount.textContent = likes.length;
};

export const createCardElement = (data, userId, handlers) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info");
  const cardImage = cardElement.querySelector(".card__image");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;
  updateLikeView(cardElement, data.likes, userId);

  if (handlers.onLikeIcon) {
    likeButton.addEventListener("click", () => handlers.onLikeIcon(data, cardElement));
  }

  if (data.owner._id === userId) {
    deleteButton.addEventListener("click", () => handlers.onDeleteCard(data, cardElement));
  } else {
    deleteButton.remove();
  }

  if (handlers.onInfoClick) {
    infoButton.addEventListener("click", () => handlers.onInfoClick(data._id));
  } else {
    infoButton.remove();
  }

  if (handlers.onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      handlers.onPreviewPicture({ name: data.name, link: data.link })
    );
  }

  return cardElement;
};
