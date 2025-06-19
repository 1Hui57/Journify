'use client';
import { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { Country, TripDaySchedule } from '@/app/type/trip';

interface UploadTripPhotoProps {
    userId: string | undefined;
    editTripData: Trip | null;
    setTsUploadPhoto: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Trip {
    id?: string;
    tripName: string;
    person: number;
    tripTime: {
        tripFrom: Timestamp;
        tripTo: Timestamp;
    };
    isPublic: boolean;
    tripCountry: Country[];
    createAt: Timestamp;
    updateAt: Timestamp;
    tripDaySchedule?: TripDaySchedule[] | null;
}

export default function UploadTripPhoto({ userId, editTripData, setTsUploadPhoto }: UploadTripPhotoProps) {

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleUpload = async () => {
        if (!file || !editTripData || !editTripData.id || !userId) return;

        setUploading(true);
        const storageRef = ref(storage, `tripPhotos/${userId}/${editTripData.id}/${editTripData.id}-tripPhoto.jpg`);
        try {
            if (!editTripData || !editTripData.id) return;
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            setPhotoUrl(downloadUrl);
            await updateDoc(doc(db, "users", userId, "trips", editTripData.id), {
                tripPhotoUrl: downloadUrl
            });
            await updateDoc(doc(db, "all_trips", editTripData.id), {
                tripPhotoUrl: downloadUrl
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
                    accept="image/*"
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