-- İlaç Asistanı - Full Database Schema
-- Sıfırdan kurulum için bu scripti Supabase SQL Editor'de çalıştırabilirsiniz.

-- 0. Önce mevcut tabloları temizleyelim (DİKKAT: Tüm veriler silinir!)
DROP TABLE IF EXISTS public.medication_logs;
DROP TABLE IF EXISTS public.medications;
DROP TABLE IF EXISTS public.profiles;

-- Eğer mevcut tüm kullanıcıları da silmek isterseniz (Supabase Auth tarafı):
-- DELETE FROM auth.users; 
-- (Not: SQL editöründe yetkiniz yoksa Dashboard -> Authentication -> Users kısmından manuel siliniz.)


--------------------------------------------------------------------------------
-- 1. PROFILES TABLOSU
--------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  tc_no text,
  birth_date date,
  gender text, -- 'Erkek', 'Kadın', 'Diğer'
  phone text,
  patient_id text UNIQUE, -- Özel hasta ID'si (PT-123456 gibi)
  created_at timestamptz DEFAULT now()
);

-- RLS (Satır Bazlı Güvenlik)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

--------------------------------------------------------------------------------
-- 1.1 OTOMATİK PROFİL OLUŞTURMA (TRIGGER)
--------------------------------------------------------------------------------
-- Yeni bir kullanıcı kayıt olduğunda (auth.users), otomatik olarak profiles tablosuna eklenir.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, tc_no, birth_date, gender, phone)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'tc_no',
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--------------------------------------------------------------------------------
-- 2. MEDICATIONS TABLOSU
--------------------------------------------------------------------------------
CREATE TABLE public.medications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,                -- İlaç Adı
  dosage text,                       -- Doz (Miktar)
  frequency text,                    -- Sıklık (Metin: "2 kez")
  frequency_count integer,           -- Günde Kaç Kez (Sayı)
  first_dose_time time,              -- İlk Doz Saati
  interval_hours integer,            -- Doz Aralığı (Hesaplanan saat)
  reminder_times text[],             -- Otomatik Hesaplanan Alarm Saatleri Array'i
  start_date date NOT NULL,          -- Kullanım Başlangıcı
  end_date date,                     -- Kullanım Bitişi (Opsiyonel)
  notes text,                        -- Özel Notlar
  status text DEFAULT 'active',      -- Veri Durumu ('active', 'completed', 'deleted')
  created_at timestamptz DEFAULT now()
);

-- RLS (Satır Bazlı Güvenlik)
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medications" ON public.medications 
  FOR ALL USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. MEDICATION_LOGS TABLOSU (Doz Takip ve Geçmiş)
--------------------------------------------------------------------------------
CREATE TABLE public.medication_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id uuid REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL, -- İlacın içilmesi gereken tam zaman
  status text DEFAULT 'pending',       -- 'pending', 'taken', 'missed'
  taken_at timestamptz,                -- Gerçek içilme zamanı
  created_at timestamptz DEFAULT now()
);

-- RLS (Satır Bazlı Güvenlik) Aktif Etme
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- Politikalar
CREATE POLICY "Users can manage own medication logs" ON public.medication_logs 
  FOR ALL USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. EKSTRA GÜVENLİK VE FONKSİYONLAR
--------------------------------------------------------------------------------
-- Mevcut auth.users tablosundaki kullanıcıları profiles tablosuna yedekle 
-- (Eski hesaplarla giriş yapıldığında FK hatası almamak için)
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Kullanıcı silindiğinde profilin de otomatik silinmesi zaten REFERENCES auth.users 
-- kısmındaki ON DELETE CASCADE ile sağlanmıştır.

