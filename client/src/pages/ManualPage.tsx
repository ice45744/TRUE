import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  ChevronLeft, ChevronDown, ChevronUp,
  LogIn, QrCode, ClipboardList, Megaphone, AlertTriangle, User,
  Award, Recycle, Star, Users, ShieldCheck, Settings,
  CheckCircle, XCircle, BookOpen, Shield
} from "lucide-react";
import { useState } from "react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  bg: string;
  border: string;
  children: React.ReactNode;
}

function Section({ icon, title, color, bg, border, children }: SectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border ${border} overflow-hidden animate-fade-in-up`} style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 ${bg} text-left`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 ${color}`}>
          {icon}
        </div>
        <span className="flex-1 text-sm font-bold text-gray-800">{title}</span>
        {open
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="bg-white px-4 py-4 space-y-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

function Note({ text, color = "blue" }: { text: string; color?: "blue" | "green" | "orange" | "red" }) {
  const map = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${map[color]}`}>
      {text}
    </div>
  );
}

export default function ManualPage() {
  const { isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="pb-28 pt-5 px-4">
      <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
        <button
          onClick={() => setLocation(isAdmin ? "/admin" : "/profile")}
          className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center card-interactive"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">คู่มือการใช้งาน</h1>
          <p className="text-xs text-gray-400">S.T. ก้าวหน้า — ระบบดิจิทัลสภานักเรียน</p>
        </div>
      </div>

      {/* ===== ส่วนนักเรียน ===== */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
            <BookOpen size={16} className="text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-700">สำหรับนักเรียนทั่วไป</p>
        </div>

        <div className="space-y-3">
          <Section icon={<LogIn size={16} />} title="การเข้าสู่ระบบและลงทะเบียน"
            color="text-blue-600" bg="bg-blue-50" border="border-blue-100">
            <p className="font-semibold text-gray-700 mb-1">ลงทะเบียนครั้งแรก</p>
            <Step num={1} text='เปิดแอปแล้วกดแท็บ "ลงทะเบียนใหม่"' />
            <Step num={2} text="กรอกชื่อ-นามสกุล, รหัสนักเรียน, และรหัสผ่านที่ต้องการตั้ง (อย่างน้อย 4 ตัว)" />
            <Step num={3} text='ช่อง "รหัสสำหรับสภานักเรียน" ให้เว้นว่างไว้ (สำหรับนักเรียนทั่วไป)' />
            <Step num={4} text='กด "ลงทะเบียนเข้าใช้งาน"' />
            <div className="mt-2" />
            <p className="font-semibold text-gray-700 mb-1">เข้าสู่ระบบครั้งถัดไป</p>
            <Step num={1} text='เลือกแท็บ "เข้าสู่ระบบ" แล้วกรอกรหัสนักเรียนและรหัสผ่าน' />
            <Step num={2} text='กด "เข้าสู่ระบบ" ระบบจะพาไปหน้าหลักอัตโนมัติ' />
            <Note text="รหัสนักเรียนใช้แทน username ต้องตรงกับที่ลงทะเบียนไว้" />
          </Section>

          <Section icon={<Award size={16} />} title="แต้มความดี — บันทึกกิจกรรมดีๆ"
            color="text-yellow-600" bg="bg-yellow-50" border="border-yellow-100">
            <Step num={1} text='ไปที่เมนู "กิจกรรม" → แท็บ "ความดี"' />
            <Step num={2} text="กรอกรายละเอียดกิจกรรมที่ทำ เช่น ช่วยครูยกของ, ทำความสะอาด" />
            <Step num={3} text="แนบรูปภาพประกอบ (ถ้ามี) ผ่านการอัปโหลดหรือวางลิงก์" />
            <Step num={4} text='กด "บันทึกกิจกรรม" รอสภานักเรียนอนุมัติ' />
            <Note text="เมื่ออนุมัติแล้ว จะได้รับ +1 แต้มความดี ทุก 10 แต้ม = ระดับถัดไป" color="green" />
          </Section>

          <Section icon={<QrCode size={16} />} title="เช็คชื่อหน้าเสาธง — รับแต้มทันที"
            color="text-amber-600" bg="bg-amber-50" border="border-amber-100">
            <Step num={1} text='ไปที่เมนู "กิจกรรม" → แท็บ "ความดี"' />
            <Step num={2} text='กดปุ่ม "สแกน QR เพื่อเช็คชื่อ" แล้วชี้กล้องไปที่ QR Code ที่สภานักเรียนแสดง' />
            <Step num={3} text="ระบบบันทึกอัตโนมัติ ได้รับ +1 แต้มความดีทันที ไม่ต้องรออนุมัติ" />
            <Note text="QR Code เช็คชื่อมีอายุสั้น ต้องสแกนทันทีที่แสดง" color="orange" />
          </Section>

          <Section icon={<Recycle size={16} />} title="ธนาคารขยะ — สะสมแสตมป์"
            color="text-green-600" bg="bg-green-50" border="border-green-100">
            <Step num={1} text='ไปที่เมนู "กิจกรรม" → แท็บ "ธนาคารขยะ"' />
            <Step num={2} text="นำขยะไปคัดแยกที่จุดธนาคารขยะ แล้วให้เจ้าหน้าที่สแกน QR ให้" />
            <Step num={3} text="สะสมแต้มขยะครบ 10 แต้ม = ได้ 1 แสตมป์ โดยอัตโนมัติ" />
            <Note text="ดูความคืบหน้าได้ที่แถบสะสมในหน้าธนาคารขยะและหน้าโปรไฟล์" color="green" />
          </Section>

          <Section icon={<Megaphone size={16} />} title="ประกาศจากโรงเรียน"
            color="text-orange-600" bg="bg-orange-50" border="border-orange-100">
            <Step num={1} text='กดเมนู "ประกาศ" ที่แถบด้านล่าง' />
            <Step num={2} text="อ่านประกาศที่โรงเรียนและสภานักเรียนโพสต์ไว้" />
            <Step num={3} text="กดที่ประกาศเพื่อดูรายละเอียดและรูปภาพประกอบ" />
            <Note text="ประกาศจะแสดงเรียงตามวันที่ล่าสุดก่อนเสมอ" />
          </Section>

          <Section icon={<AlertTriangle size={16} />} title="แจ้งปัญหา"
            color="text-red-600" bg="bg-red-50" border="border-red-100">
            <Step num={1} text='กดเมนู "แจ้งปัญหา" ที่แถบด้านล่าง' />
            <Step num={2} text="เลือกหมวดหมู่ปัญหา แล้วเขียนรายละเอียด" />
            <Step num={3} text="แนบรูปภาพประกอบ (ถ้ามี)" />
            <Step num={4} text='กด "ส่งรายงาน" รอสภานักเรียนดำเนินการ' />
            <Note text="สามารถดูสถานะคำร้องของตัวเองได้ในหน้าแจ้งปัญหา" color="orange" />
          </Section>

          <Section icon={<User size={16} />} title="โปรไฟล์และการตั้งค่า"
            color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100">
            <Step num={1} text='กดเมนู "โปรไฟล์" ที่แถบด้านล่าง เพื่อดูแต้มและแสตมป์ทั้งหมด' />
            <Step num={2} text='กด "แก้ไขข้อมูลส่วนตัว" เพื่อเปลี่ยนชื่อหรือรูปโปรไฟล์' />
            <Step num={3} text='กดไอคอนกล้องที่รูปโปรไฟล์เพื่ออัปโหลดรูปใหม่' />
            <Note text="ข้อมูลแต้มและแสตมป์อัปเดตแบบ real-time ทุก 5 วินาที" color="blue" />
          </Section>
        </div>
      </div>

      {/* ===== ส่วน Admin (เห็นเฉพาะ Admin) ===== */}
      {isAdmin && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Shield size={16} className="text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-gray-700">สำหรับสภานักเรียน (Admin)</p>
            <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">Admin Only</span>
          </div>

          <div className="space-y-3">
            <Section icon={<ShieldCheck size={16} />} title="การสมัครเป็น Admin"
              color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100">
              <Step num={1} text='ไปที่หน้า "ลงทะเบียนใหม่" ในหน้า Login' />
              <Step num={2} text="กรอกชื่อ, รหัสนักเรียน, รหัสผ่านตามปกติ" />
              <Step num={3} text='ในช่อง "รหัสสำหรับสภานักเรียน" ให้ใส่รหัสที่ได้รับจากผู้ดูแลระบบ' />
              <Step num={4} text="ระบบจะกำหนดสิทธิ์ Admin ให้อัตโนมัติ จะเห็นเมนู Admin ที่แถบล่าง" />
              <Note text="รหัสสภานักเรียนเป็นความลับ ห้ามเผยแพร่ให้นักเรียนทั่วไป" color="red" />
            </Section>

            <Section icon={<CheckCircle size={16} />} title="อนุมัติกิจกรรมความดี"
              color="text-green-600" bg="bg-green-50" border="border-green-100">
              <Step num={1} text='ในแผงควบคุม Admin กด "อนุมัติกิจกรรม"' />
              <Step num={2} text="ดูรายการที่รอการอนุมัติ กดเพื่อดูรายละเอียดและรูปภาพ" />
              <Step num={3} text='กด "อนุมัติ" เพื่อให้แต้ม +1 แก่นักเรียน หรือ "ปฏิเสธ" หากไม่เหมาะสม' />
              <Note text="รายการที่อนุมัติ/ปฏิเสธแล้วจะถูกลบออกอัตโนมัติหลัง 24 ชั่วโมง" color="orange" />
              <Note text="หน้านี้รีเฟรชทุก 10 วินาทีอัตโนมัติ ไม่ต้องกดรีโหลด" color="blue" />
            </Section>

            <Section icon={<QrCode size={16} />} title="สร้าง QR Code"
              color="text-purple-600" bg="bg-purple-50" border="border-purple-100">
              <Step num={1} text='ในแผงควบคุม Admin กด "สร้าง QR Code"' />
              <Step num={2} text="เลือกประเภท: เช็คชื่อ (ได้แต้มความดี) หรือ ธนาคารขยะ (ได้แต้มขยะ)" />
              <Step num={3} text="QR Code จะแสดงขึ้นมา นำไปแสดงให้นักเรียนสแกน" />
              <Note text="QR Code มีอายุการใช้งานสั้น ควรสร้างใหม่ทุกครั้งที่ใช้งาน" color="orange" />
              <Note text="QR แต่ละโค้ดใช้ได้ครั้งเดียวต่อนักเรียน 1 คน" color="blue" />
            </Section>

            <Section icon={<Megaphone size={16} />} title="จัดการประกาศ"
              color="text-orange-600" bg="bg-orange-50" border="border-orange-100">
              <Step num={1} text='กด "จัดการประกาศ" ในแผงควบคุม' />
              <Step num={2} text='กด "เพิ่มประกาศ" กรอกหัวข้อ เนื้อหา และรูปภาพประกอบ (ถ้ามี)' />
              <Step num={3} text="กดบันทึก ประกาศจะแสดงในหน้าประกาศของนักเรียนทันที" />
              <Step num={4} text="กดปุ่มลบที่ประกาศเพื่อลบออกเมื่อหมดอายุ" />
            </Section>

            <Section icon={<AlertTriangle size={16} />} title="ดูและจัดการรายงานปัญหา"
              color="text-red-600" bg="bg-red-50" border="border-red-100">
              <Step num={1} text='กด "ดูรายงานปัญหา" ในแผงควบคุม' />
              <Step num={2} text="ดูรายการปัญหาที่นักเรียนส่งมา พร้อมรายละเอียดและรูปภาพ" />
              <Step num={3} text='กด "ดำเนินการแล้ว" เมื่อแก้ไขปัญหาเสร็จ หรือ "ปฏิเสธ" หากไม่ใช่ปัญหาจริง' />
              <Note text="รายงานที่ดำเนินการแล้วจะถูกลบออกอัตโนมัติหลัง 24 ชั่วโมง" color="orange" />
            </Section>

            <Section icon={<Users size={16} />} title="จัดการนักเรียน"
              color="text-blue-600" bg="bg-blue-50" border="border-blue-100">
              <Step num={1} text='กด "จัดการนักเรียน" ในแผงควบคุม' />
              <Step num={2} text="ดูรายชื่อนักเรียนทั้งหมดพร้อมแต้มและแสตมป์ของแต่ละคน" />
              <Step num={3} text="ค้นหาชื่อหรือรหัสนักเรียนได้จากช่องค้นหาด้านบน" />
              <Note text="หน้านี้แสดงทั้ง Admin และนักเรียน มีป้าย Role กำกับ" color="blue" />
            </Section>

            <Section icon={<Settings size={16} />} title="โหมดปิดปรับปรุงระบบ"
              color="text-gray-600" bg="bg-gray-50" border="border-gray-200">
              <Step num={1} text='ในแผงควบคุม Admin เลื่อนลงมาที่ส่วน "โหมดปิดปรับปรุง"' />
              <Step num={2} text="กรอกข้อความแจ้งนักเรียน และเลือกวันเวลาที่คาดว่าจะเสร็จ" />
              <Step num={3} text='กด "บันทึกข้อความและเวลา" ก่อน แล้วค่อยเปิดสวิตช์' />
              <Step num={4} text='หากต้องการปิดทันที กดปุ่ม "ปิดทันที" ที่แบนเนอร์สีแดงด้านบน' />
              <Note text="Admin จะยังเข้าใช้งานได้ปกติแม้เปิดโหมดปรับปรุง นักเรียนเท่านั้นที่จะเห็นหน้าปรับปรุง" color="orange" />
              <Note text="หากออกจากระบบตอน maintenance เปิดอยู่ กดลิงก์ 'สำหรับเจ้าหน้าที่' ที่หน้าปรับปรุงได้เลย" color="blue" />
            </Section>

            <Section icon={<XCircle size={16} />} title="การออกจากระบบ Admin"
              color="text-red-600" bg="bg-red-50" border="border-red-100">
              <Step num={1} text='กดไอคอนออกจากระบบ (มุมขวาบน) ในแผงควบคุม' />
              <Step num={2} text='ระบบจะถามยืนยันก่อนเสมอ กด "ออกจากระบบ" เพื่อยืนยัน หรือ "ยกเลิก" เพื่อย้อนกลับ' />
              <Note text="มีกล่องยืนยันป้องกันการกดออกโดยบังเอิญ ไม่ต้องกังวล" color="green" />
            </Section>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        S.T. Digital System v1.0.0<br />
        พัฒนาโดยสภานักเรียนโรงเรียน
      </p>
    </div>
  );
}
