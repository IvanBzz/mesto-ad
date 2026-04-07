import { createCardElement, updateLikeView } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import {
  addCard,
  changeLikeCardStatus,
  deleteCard,
  getCardList,
  getUserInfo,
  setUserAvatar,
  setUserInfo,
} from "./components/api.js";
import { clearValidation, enableValidation } from "./components/validation.js";

const placesWrap = document.querySelector(".places__list");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalUsersList = cardInfoModalWindow.querySelector(".popup__list");
const infoDefinitionTemplate = document.getElementById("popup-info-definition-template").content;
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template").content;

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input_type_avatar");

const validationConfig = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

const buttonTextConfig = {
  profile: {
    default: "Сохранить",
    loading: "Сохранение...",
  },
  avatar: {
    default: "Сохранить",
    loading: "Сохранение...",
  },
  card: {
    default: "Создать",
    loading: "Создание...",
  },
  remove: {
    default: "Да",
    loading: "Удаление...",
  },
};

let currentUserId = "";
let pendingDeleteCard = null;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const infoItem = infoDefinitionTemplate
    .querySelector(".popup__info-item")
    .cloneNode(true);

  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;

  return infoItem;
};

const createUserPreview = (text) => {
  const userPreview = infoUserPreviewTemplate
    .querySelector(".popup__list-item")
    .cloneNode(true);

  userPreview.textContent = text;
  return userPreview;
};

const renderLoading = (formElement, isLoading, { default: defaultText, loading }) => {
  const submitButton = formElement.querySelector(".popup__button");
  submitButton.textContent = isLoading ? loading : defaultText;
};

const setProfileData = ({ name, about, avatar, _id }) => {
  profileTitle.textContent = name;
  profileDescription.textContent = about;
  profileAvatar.style.backgroundImage = `url("${avatar}")`;
  currentUserId = _id;
};

const renderCard = (cardData, method = "append") => {
  const cardElement = createCardElement(cardData, currentUserId, {
    onPreviewPicture: handlePreviewPicture,
    onLikeIcon: handleLikeClick,
    onDeleteCard: handleDeleteClick,
    onInfoClick: handleInfoClick,
  });

  placesWrap[method](cardElement);
};

function handleInfoClick(cardId) {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);

      if (!cardData) {
        return Promise.reject("Не удалось найти карточку");
      }

      cardInfoTitle.textContent = `Карточка «${cardData.name}»`;
      cardInfoText.textContent = cardData.likes.length
        ? "Пользователи, которые поставили лайк"
        : "Лайков пока нет";
      cardInfoModalInfoList.replaceChildren(
        createInfoString("Автор:", cardData.owner.name),
        createInfoString("Дата создания:", formatDate(new Date(cardData.createdAt))),
        createInfoString("Лайков:", String(cardData.likes.length)),
        createInfoString("Идентификатор:", cardData._id)
      );
      cardInfoModalUsersList.replaceChildren(
        ...(cardData.likes.length
          ? cardData.likes.map((user) => createUserPreview(`${user.name} · ${user.about}`))
          : [createUserPreview("Пока никто не лайкнул эту карточку")])
      );

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
}

function handleLikeClick(cardData, cardElement) {
  const isLiked = cardData.likes.some((user) => user._id === currentUserId);

  changeLikeCardStatus(cardData._id, isLiked)
    .then((updatedCard) => {
      cardData.likes = updatedCard.likes;
      updateLikeView(cardElement, updatedCard.likes, currentUserId);
    })
    .catch((err) => {
      console.log(err);
    });
}

function handleDeleteClick(cardData, cardElement) {
  pendingDeleteCard = { cardData, cardElement };
  openModalWindow(removeCardModalWindow);
}

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  renderLoading(profileForm, true, buttonTextConfig.profile);
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      setProfileData(userData);
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(profileForm, false, buttonTextConfig.profile);
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();

  renderLoading(avatarForm, true, buttonTextConfig.avatar);
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      setProfileData(userData);
      avatarForm.reset();
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(avatarForm, false, buttonTextConfig.avatar);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();

  renderLoading(cardForm, true, buttonTextConfig.card);
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      renderCard(cardData, "prepend");
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(cardForm, false, buttonTextConfig.card);
    });
};

const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();

  if (!pendingDeleteCard) {
    return;
  }

  renderLoading(removeCardForm, true, buttonTextConfig.remove);
  deleteCard(pendingDeleteCard.cardData._id)
    .then(() => {
      pendingDeleteCard.cardElement.remove();
      pendingDeleteCard = null;
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(removeCardForm, false, buttonTextConfig.remove);
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationConfig);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationConfig);
  openModalWindow(cardFormModalWindow);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    setProfileData(userData);
    cards.forEach((cardData) => {
      renderCard(cardData);
    });
  })
  .catch((err) => {
    console.log(err);
  });

enableValidation(validationConfig);

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});
