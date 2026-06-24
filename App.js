import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// Import local services and components
import {
  getPhotos,
  savePhotos,
} from "./src/services/storage";
import { generateImageDescription } from "./src/services/gemini";
import PhotoCard from "./src/components/PhotoCard";
import DetailModal from "./src/components/DetailModal";

// Load Gemini API Key directly from environment variables
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      const storedPhotos = await getPhotos();
      setPhotos(storedPhotos);

      // Yêu cầu quyền vị trí và camera ngay khi mở ứng dụng để tránh bị đơ luồng khi đang loading
      try {
        console.log("Khởi động: Đang yêu cầu quyền định vị...");
        await Location.requestForegroundPermissionsAsync();
        
        console.log("Khởi động: Đang yêu cầu quyền camera...");
        await ImagePicker.requestCameraPermissionsAsync();
      } catch (e) {
        console.log("Khởi động: Lỗi yêu cầu quyền tự động:", e.message);
      }
    }
    loadInitialData();
  }, []);

  // Compute stats
  const totalPhotos = photos.length;
  const uniqueLocations = new Set(
    photos.map((p) => `${p.latitude.toFixed(2)},${p.longitude.toFixed(2)}`),
  ).size;

  const handlePickImagePress = () => {
    Alert.alert(
      "Thêm ảnh mới",
      "Bạn muốn chụp ảnh mới hay chọn ảnh sẵn có?",
      [
        { text: "Chụp ảnh (Camera)", onPress: handleTakePhoto },
        { text: "Chọn từ Thư viện", onPress: handleSelectPhoto },
        { text: "Hủy", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Ứng dụng cần quyền sử dụng camera để chụp ảnh.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        processPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      Alert.alert("Lỗi", "Không thể khởi động camera.");
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Ứng dụng cần quyền truy cập thư viện ảnh để tải ảnh.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        processPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
      Alert.alert("Lỗi", "Không thể truy cập thư viện ảnh.");
    }
  };

  const processPhoto = async (asset) => {
    console.log("=== BẮT ĐẦU XỬ LÝ ẢNH THỰC TẾ ===");
    setIsAnalyzing(true);
    setAnalysisStatus("Đang lấy vị trí GPS...");

    let coords = null;
    let address = "";

    try {
      console.log("Bước 1: Kiểm tra trạng thái quyền định vị...");
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log("Quyền hiện tại:", status);

      if (status !== "granted") {
        throw new Error(
          "Ứng dụng chưa có quyền vị trí. Vui lòng vào Cài đặt máy -> Tìm ứng dụng Expo Go -> Cho phép truy cập Vị trí (Location).",
        );
      }

      console.log("Bước 2: Bắt đầu lấy tọa độ GPS thực tế...");

      // Thử lấy vị trí đã biết gần nhất trước (tốc độ phản hồi cực nhanh)
      let location = null;
      try {
        console.log("Thử lấy vị trí đã biết gần nhất...");
        location = await Location.getLastKnownPositionAsync({});
        if (location) {
          console.log("Lấy vị trí gần nhất thành công:", location.coords);
        }
      } catch (e) {
        console.log("Không lấy được vị trí đã biết gần nhất:", e.message);
      }

      // Nếu không có vị trí gần nhất, yêu cầu vị trí hiện tại với Timeout tối đa 10 giây
      if (!location) {
        console.log("Đang truy vấn GPS thực tế (Timeout: 10s)...");
        const gpsPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Yêu cầu định vị GPS bị quá giờ (10s). Vui lòng thử lại ở nơi có sóng tốt hơn.",
                ),
              ),
            10000,
          ),
        );

        location = await Promise.race([gpsPromise, timeoutPromise]);
        console.log("Lấy vị trí hiện tại thành công:", location.coords);
      }

      if (!location || !location.coords) {
        throw new Error("Không nhận được dữ liệu tọa độ từ thiết bị.");
      }

      coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log("Tọa độ thực tế sử dụng:", coords);

      setAnalysisStatus("Đang xác định địa chỉ...");
      console.log("Bước 3: Dịch tọa độ thành địa chỉ thực tế...");
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(coords);
        if (reverseGeocode && reverseGeocode.length > 0) {
          const first = reverseGeocode[0];
          const parts = [
            first.streetNumber,
            first.street,
            first.district,
            first.city || first.region,
            first.country,
          ].filter(Boolean);
          address = parts.join(", ");
          console.log("Dịch địa chỉ thành công:", address);
        } else {
          address = `Tọa độ: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
          console.log(
            "Không nhận được địa danh cụ thể, sử dụng tọa độ thô làm địa chỉ.",
          );
        }
      } catch (geoErr) {
        console.log("Lỗi dịch tọa độ:", geoErr.message);
        address = `Tọa độ: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      }
    } catch (locErr) {
      console.log("Lỗi lấy định vị thực tế:", locErr.message);
      setIsAnalyzing(false);
      setAnalysisStatus("");
      Alert.alert("Lỗi định vị", locErr.message);
      console.log("=== TIẾN TRÌNH BỊ HỦY DO THIẾU GPS THỰC ===");
      return; // Dừng xử lý ảnh hoàn toàn
    }

    setAnalysisStatus("Gemini AI đang mô tả bức ảnh...");
    console.log("Bước 4: Gọi Gemini AI thực tế...");

    try {
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(
          "Chưa thiết lập Gemini API Key. Vui lòng bấm vào cài đặt ở góc trên bên phải để nhập API Key thực.",
        );
      }

      const description = await generateImageDescription(asset.base64, apiKey);
      console.log("Gọi Gemini AI thành công! Mô tả:", description);

      const newPhoto = {
        id: Date.now().toString(),
        uri: asset.uri,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address,
        description: description,
        timestamp: Date.now(),
      };

      console.log("Bước 5: Lưu thông tin ảnh thực tế vào AsyncStorage...");
      const updatedPhotos = [newPhoto, ...photos];
      setPhotos(updatedPhotos);
      await savePhotos(updatedPhotos);
      console.log(
        "Lưu thành công. Tổng số lượng ảnh hiện tại:",
        updatedPhotos.length,
      );

      Alert.alert("Thành công", "Đã lưu ảnh và tạo mô tả thành công!");
    } catch (gemErr) {
      console.log(
        "Lỗi xảy ra trong quá trình xử lý với Gemini AI:",
        gemErr.message,
      );
      Alert.alert("Lỗi phân tích ảnh", gemErr.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
      console.log("=== KẾT THÚC XỬ LÝ ẢNH ===");
    }
  };

  const handleDeletePhoto = async (id) => {
    const updatedPhotos = photos.filter((p) => p.id !== id);
    setPhotos(updatedPhotos);
    await savePhotos(updatedPhotos);
  };

  const handleResetAll = async () => {
    Alert.alert(
      "Xóa sạch dữ liệu",
      "Bạn có chắc chắn muốn xóa toàn bộ các bức ảnh đã chụp khỏi bộ sưu tập?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa sạch",
          style: "destructive",
          onPress: async () => {
            setPhotos([]);
            await savePhotos([]);
            Alert.alert("Đã xóa", "Đã xóa toàn bộ ảnh lưu trữ.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="camera" size={20} color="#6366f1" />
          </View>
          <View>
            <Text style={styles.headerTitle}>PhotoMap AI</Text>
            <Text style={styles.headerSubtitle}>
              Lưu trữ khoảnh khắc & bản đồ
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleResetAll}
        >
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Board */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons
            name="images-outline"
            size={18}
            color="#6366f1"
            style={styles.statIcon}
          />
          <View>
            <Text style={styles.statValue}>{totalPhotos}</Text>
            <Text style={styles.statLabel}>Bức ảnh</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <Ionicons
            name="map-outline"
            size={18}
            color="#06b6d4"
            style={styles.statIcon}
          />
          <View>
            <Text style={styles.statValue}>{uniqueLocations}</Text>
            <Text style={styles.statLabel}>Vùng địa lý</Text>
          </View>
        </View>
      </View>

      {/* Main List / Empty State */}
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="image-outline" size={48} color="#475569" />
          </View>
          <Text style={styles.emptyTextTitle}>Chưa có hình ảnh nào</Text>
          <Text style={styles.emptyTextDesc}>
            Hãy bắt đầu bằng cách chụp một bức ảnh mới, Gemini AI sẽ tự động
            phân tích và tạo mô tả kết hợp lưu vị trí bản đồ.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handlePickImagePress}
          >
            <Ionicons name="camera" size={18} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Chụp ảnh đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhotoCard
              photo={item}
              onPress={() => setSelectedPhoto(item)}
              onDelete={() => handleDeletePhoto(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handlePickImagePress}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingTitle}>Đang xử lý hình ảnh</Text>
            <Text style={styles.loadingSubtitle}>{analysisStatus}</Text>
          </View>
        </View>
      )}



      {/* Detail Modal */}
      <DetailModal
        visible={!!selectedPhoto}
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handleDeletePhoto}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#64748b",
    fontSize: 11,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 14,
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statIcon: {
    marginRight: 10,
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  emptyTextTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyTextDesc: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#818cf8",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: "#1e293b",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
    width: "80%",
  },
  loadingTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  loadingSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
