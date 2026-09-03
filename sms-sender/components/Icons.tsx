import React from "react";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

interface IconProps {
  size?: number;
  color?: string;
}

export function IconCompose({ size = 20, color = "#3D2619" }: IconProps) {
  return <Feather name="edit-3" size={size} color={color} />;
}

export function IconContacts({ size = 20, color = "#3D2619" }: IconProps) {
  return <Ionicons name="people-outline" size={size} color={color} />;
}

export function IconHistory({ size = 20, color = "#3D2619" }: IconProps) {
  return <Ionicons name="time-outline" size={size} color={color} />;
}

export function IconSearch({ size = 18, color = "#9C8E84" }: IconProps) {
  return <Ionicons name="search-outline" size={size} color={color} />;
}

export function IconSim({ size = 18, color = "#3D2619" }: IconProps) {
  return <MaterialCommunityIcons name="sim" size={size} color={color} />;
}

export function IconCheck({ size = 16, color = "#FFFFFF" }: IconProps) {
  return <Ionicons name="checkmark-sharp" size={size} color={color} />;
}

export function IconSend({ size = 18, color = "#FFFFFF" }: IconProps) {
  return <Feather name="send" size={size} color={color} />;
}

export function IconClose({ size = 18, color = "#6E5F55" }: IconProps) {
  return <Ionicons name="close" size={size} color={color} />;
}

export function IconRefresh({ size = 18, color = "#3D2619" }: IconProps) {
  return <Ionicons name="refresh-outline" size={size} color={color} />;
}

export function IconChevronRight({ size = 16, color = "#9C8E84" }: IconProps) {
  return <Ionicons name="chevron-forward" size={size} color={color} />;
}

export function IconTrash({ size = 18, color = "#B91C1C" }: IconProps) {
  return <Ionicons name="trash-outline" size={size} color={color} />;
}

export function IconWarning({ size = 22, color = "#B45309" }: IconProps) {
  return <Ionicons name="warning-outline" size={size} color={color} />;
}

export function IconPause({ size = 16, color = "#B45309" }: IconProps) {
  return <Ionicons name="pause" size={size} color={color} />;
}

export function IconPlay({ size = 16, color = "#FFFFFF" }: IconProps) {
  return <Ionicons name="play" size={size} color={color} />;
}
