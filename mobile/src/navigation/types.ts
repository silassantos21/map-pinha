// Params de cada tela do stack raiz — ver RootNavigator.tsx. Centralizado
// aqui porque várias telas precisam do tipo pra `useNavigation`/`useRoute`.
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  PoiForm: { poiId?: string; initialLat?: number; initialLng?: number } | undefined;
  PoiDetail: { poiId: string };
  UserProfile: { userId: string };
  UserSearch: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
};

export type MainTabParamList = {
  MapTab: undefined;
  FavoritesTab: undefined;
  SocialTab: undefined;
  NotificationsTab: undefined;
};
