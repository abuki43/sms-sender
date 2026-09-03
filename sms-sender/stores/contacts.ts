import { create } from "zustand";

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: { number: string; isPrimary: boolean }[];
}

interface ContactStore {
  selectedContacts: Contact[];
  selectedGroupName: string | null;
  setSelectedGroupName: (name: string | null) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  toggleContact: (contact: Contact) => void;
  selectAll: (contacts: Contact[]) => void;
  setSelectedContacts: (contacts: Contact[], groupName?: string | null) => void;
  clearAll: () => void;
}

export const useContactsStore = create<ContactStore>((set) => ({
  selectedContacts: [],
  selectedGroupName: null,

  setSelectedGroupName: (name) => set({ selectedGroupName: name }),

  addContact: (contact) =>
    set((state) => ({
      selectedContacts: [...state.selectedContacts, contact],
      selectedGroupName: null,
    })),

  removeContact: (id) =>
    set((state) => ({
      selectedContacts: state.selectedContacts.filter((c) => c.id !== id),
      selectedGroupName: null,
    })),

  toggleContact: (contact) =>
    set((state) => {
      const exists = state.selectedContacts.some((c) => c.id === contact.id);
      if (exists) {
        return {
          selectedContacts: state.selectedContacts.filter(
            (c) => c.id !== contact.id
          ),
          selectedGroupName: null,
        };
      }
      return {
        selectedContacts: [...state.selectedContacts, contact],
        selectedGroupName: null,
      };
    }),

  selectAll: (contacts) =>
    set({ selectedContacts: contacts, selectedGroupName: null }),

  setSelectedContacts: (contacts, groupName = null) =>
    set({ selectedContacts: contacts, selectedGroupName: groupName }),

  clearAll: () => set({ selectedContacts: [], selectedGroupName: null }),
}));
