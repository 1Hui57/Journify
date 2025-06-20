'use client';
import { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { Country, TripDaySchedule } from '@/app/type/trip';

interface UploadMemberPhotoProps {
    userId: string | undefined;
    setTsUploadPhoto: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function UploadMemberPhoto({ userId, setTsUploadPhoto }: UploadMemberPhotoProps) {

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE_MB = 2;
    const ALLOWED_TYPES = ["image/jpeg", "image/png"];

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const isValidType = ALLOWED_TYPES.includes(selectedFile.type);
        const isValidSize = selectedFile.size / (1024 * 1024) <= MAX_FILE_SIZE_MB;

        if (!isValidType) {
            alert("請選擇 JPG 或 PNG 格式的圖片");
            return;
        }

        if (!isValidSize) {
            alert("圖片大小不可超過 2MB");
            return;
        }

        setFile(selectedFile);
        setFileName(selectedFile.name);
    };

    const handleUpload = async () => {
        if (!file || !userId) return;

        setUploading(true);
        const storageRef = ref(storage, `memberPhotos/${userId}/${userId}-tripPhoto.jpg`);
        try {
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            await updateDoc(doc(db, "users", userId), {
                memberPhotoUrl: downloadUrl
            });
            console.log("上傳成功 URL:", downloadUrl);
            alert("上傳成功！");
        } catch (err) {
            console.error("上傳失敗", err);
            alert("圖片上傳失敗");
        } finally {
            setUploading(false);
            setTsUploadPhoto(false); // 關閉 modal
        }
    };


    return (
        <div className="fixed inset-0 bg-myzinc900-50 flex items-center justify-center overflow-y-auto ">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 h-fit" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 text-lg font-bold text-myblue-800">上傳封面圖片</div>

                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />

                <button
                    onClick={handleChooseFile}
                    className="px-4 py-2 bg-myzinc-100 text-myblue-700 rounded hover:bg-myzinc-200"
                >
                    選擇圖片
                </button>

                {fileName && (
                    <div className="mt-2 text-sm text-myzinc-700">
                        已選擇：<span className="font-medium">{fileName}</span>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                    <button
                        onClick={() => setTsUploadPhoto(false)}
                        className="mt-4 px-4 py-2 text-base-400 text-myblue-600 rounded-full hover:bg-myzinc-200"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="mt-4 px-4 py-2  text-myblue-600 bg-primary-300 text-base-500 rounded-full hover:text-primary-300 hover:bg-myblue-700"
                    >
                        {uploading ? "上傳中..." : "上傳圖片"}
                    </button>
                </div>
            </div>
        </div>
    );
}