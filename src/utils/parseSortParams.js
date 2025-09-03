import { SORT_ORDER } from "../constants/index.js";

const parseSortOrder = (sortOrder) => {
    const isKnownOrder = [SORT_ORDER.ASC,
    SORT_ORDER.DESC].includes(sortOrder);
    if (isKnownOrder) return sortOrder;
    return SORT_ORDER.ASC;
};

const parseSortBy = (sortBy) => {
    const keysOfContact = [
        '_id',
        'name',
        'phoneNumber',
        'email',
        'isFavourite',
        'contactType',
        'createdAt',
        'updatedAt',
    ];
    if (keysOfContact.includes(sortBy)) {
        return sortBy;
    }
    return '_id';
};

export const parseSortParams = (query) => {
    const { sortOrder, sortBy, type, isFavourite } = query;

    const parsedSortOrder = parseSortOrder(sortOrder);
    const parsedSortBy = parseSortBy(sortBy);

    let parsedIsFavourite;

    if (isFavourite === 'true') {
        parsedIsFavourite = true;
    } else if (isFavourite === 'false') {
        parsedIsFavourite = false;
    } else {
        parsedIsFavourite = undefined;
    }

    return {
        sortOrder: parsedSortOrder,
        sortBy: parsedSortBy,
        type,
        isFavourite: parsedIsFavourite,
    };
};