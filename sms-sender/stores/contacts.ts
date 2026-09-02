import { create } from "zustand";

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: { number: string; isPrimary: boolean }[];
}

interface ContactStore {
  selectedContacts: Contact[];
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  toggleContact: (contact: Contact) => void;
  selectAll: (contacts: Contact[]) => void;
  clearAll: () => void;
}

export const useContactsStore = create<ContactStore>((set) => ({
  selectedContacts: [],

  addContact: (contact) =>
    set((state) => ({
      selectedContacts: [...state.selectedContacts, contact],
    })),

  removeContact: (id) =>
    set((state) => ({
      selectedContacts: state.selectedContacts.filter((c) => c.id !== id),
    })),

  toggleContact: (contact) =>
    set((state) => {
      const exists = state.selectedContacts.some((c) => c.id === contact.id);
      if (exists) {
        return {
          selectedContacts: state.selectedContacts.filter(
            (c) => c.id !== contact.id
          ),
        };
      }
      return {
        selectedContacts: [...state.selectedContacts, contact],
      };
    }),

  selectAll: (contacts) => set({ selectedContacts: contacts }),

  clearAll: () => set({ selectedContacts: [] }),
}));
