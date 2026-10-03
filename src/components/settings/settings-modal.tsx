import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Language } from '@/constants/translations';
import { useLanguage } from '@/context/language-context';
import { checkNotificationPermission, requestNotificationPermission } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

// ─── Multi-Language Policy Contents ──────────────────────────────────────────

const PRIVACY_POLICY_CONTENT: Record<Language, string> = {
  kurdish: `**سیاسەتی تایبەتمەندی**

ئەم سیاسەتەی تایبەتمەندییە بۆ ئەپڵیکەیشنی (ئیسکان نرخەکان)ـی ئامێرە مۆبایلەکان جێبەجێ دەبێت، لەگەڵ هەر خزمەتگوزارییەکی پەیوەندیدار کە لەلایەن (مۆمین) بەڕێوەدەبرێت (بە کۆمەڵ پێیان دەوترێت "ئەپڵیکەیشن").

**زانیارییە کۆکراوەکان**

کاتێک ئەپڵیکەیشنەکە بەکاردەهێنیت، بەم شێوەیە زانیارییەکان لەوانەیە کۆبکرێنەوە:
• نیشانی پرۆتۆکۆڵی ئینتەرنێتی ئامێرەکەت (IP)
• لاپەڕە سەردانکراوەکانی ناو ئەپڵیکەیشن، بەروار و کاتی سەردانیکردن
• ئەو کاتەی لەناو ئەپڵیکەیشنەکە بەسەر براوە
• سیستەمی کارپێکردنی مۆبایلەکەت

**سەلماندنی ناسنامە و زانیاری هەژمار**

ئەپڵیکەیشنەکە Google Sign-In و Sign in with Apple بەکاردەهێنێت بۆ سەلماندنی ناسنامەی بەکارهێنەران. کاتێک بە یەکێک لەم خزمەتگوزارییانە دەچیتە ژوورەوە، ئیمەیڵ و ناسێنەری تایبەتی ئەکاونتەکەت وەردەگرین بۆ دروستکردن و بەڕێوەبردنی هەژمارەکەت. لە Sign in with Apple دەتوانیت هەڵبژێریت ئیمەیڵەکەت بشاریتەوە؛ لەم حاڵەتەدا Apple دەتوانێت ئیمەیڵێکی تایبەتی (relay) بەکاربهێنێت. ئەپڵیکەیشنەکە زانیاری شوێنپێهەڵگرتنی جۆگرافی (GPS) کۆناکاتەوە.

**زانیاری هەژماری VIP**

ئەگەر بەشداری لە پلانی (VIP) بکەیت، دەستگەیشتن لە ڕێگەی کۆدی ناسێنەری پشتڕاستکراوە بەڕێوەدەبرێت کە لەلایەن بەڕێوەبەرایەتی دەدرێت. ئەپڵیکەیشنەکە هیچ زانیارییەکی کارتی بانکی یان هەژماری بانکی تۆ کۆناکاتەوە و پاشەکەوتی ناکات.

**سڕینەوەی هەژمار و بەڕێوەبردنی زانیارییەکان**

بەکارهێنەران مافی تەواویان هەیە لە هەر کاتێکدا داوای سڕینەوەی هەمیشەیی هەژمار و سەرجەم زانیارییە پەیوەندیدارەکانیان بکەن:
١. لەناو ئەپڵیکەیشن: بچۆ بەشی ڕێکخستنەکان (Settings) > کرتە بکە لەسەر "سڕینەوەی هەژمار و زانیاری" بۆ سڕینەوەی دەستبەجێ.
٢. لە ڕێگەی ئیمەیڵ: دەتوانیت داواکاری سڕینەوەی هەژمارەکەت بنێریت بۆ muminrtx@gmail.com لە ڕێگەی ئەو ئیمەیڵەی تۆمارت کردووە.

**دەستگەیشتنی لایەنی سێیەم**

تەنها زانیاری گشتی و بێناونیشان ناوبەناو بۆ خزمەتگوزارییە دەرەکییەکان دەنێردرێت بۆ یارمەتیدان لە باشترکردنی ئەپڵیکەیشنەکە. ئێمە زانیارییە کەسییەکانت بە هیچ لایەنێکی سێیەم ناخۆین و نایفڕۆشین.

**پاراستنی زانیارییەکان**

زانیاری هەژماری بەکارهێنەران بۆ ماوەی بەکارهێنانی ئەپڵیکەیشنەکە و ١٢ مانگ دوای ئەوەش دەهێڵرێتەوە، مەگەر یاسا ماوەیەکی درێژتر داوا بکات.

**منداڵان**

ئەم ئەپڵیکەیشنە بۆ منداڵانی ژێر تەمەنی ١٦ ساڵ دیاری نەکراوە. ئێمە بە ئەنقەست زانیاری لە منداڵان کۆناکەینەوە.

**ئاسایش**

ئێمە ڕێکاری جەستەیی، ئەلیکترۆنی و یاسایی دابین دەکەین بۆ پاراستنی ئەو زانیارییانەی پرۆسەیان دەکەین و دەیانپارێزین.

**گۆڕانکارییەکان**

ئێمە لەوانەیە ناوبەناو ئەم سیاسەتەی تایبەتمەندییە نوێ بکەینەوە. گۆڕانکارییە گرنگەکان لە ڕێگەی بڵاوکردنەوەی سیاسەتە نوێکراوەکە بە بەروارێکی کارپێکراوەوە ڕادەگەیەنین.

**پەیوەندیکردن بە ئێمە**

ئەگەر هەر پرسیارێکت هەبوو سەبارەت بە تایبەتمەندی، تکایە پەیوەندیمان پێوە بکە لە ڕێگەی ئیمەیڵی:
muminrtx@gmail.com

بەرواری کارپێکردن: ٢٠٢٦-٠٨-٠٩`,

  arabic: `**سياسة الخصوصية**

تنطبق سياسة الخصوصية هذه على تطبيق (إسكان نرخەكان) للأجهزة المحمولة، إلى جانب أي خدمات ذات صلة يديرها مؤمن (المشار إليها إجمالاً بـ "التطبيق").

**المعلومات التي نجمعها**

عند استخدام التطبيق، قد نجمع:
• عنوان بروتوكول الإنترنت (IP) الخاص بجهازك
• الصفحات التي تمت زيارتها داخل التطبيق، وتاريخ ووقت الزيارة
• الوقت المنقضي في التطبيق
• نظام تشغيل هاتفك المحمول

**مصادقة الحساب ومعلوماته**

يستخدم التطبيق تسجيل الدخول عبر Google وميزة تسجيل الدخول باستخدام Apple للتحقق من هوية المستخدمين. عند تسجيل الدخول بإحدى هاتين الخدمتين، نتلقى بريدك الإلكتروني ومعرفًا فريدًا لحسابك لإنشاء حسابك وإدارته. عند استخدام Apple، يمكنك اختيار إخفاء بريدك الإلكتروني؛ وفي هذه الحالة قد تزودنا Apple بعنوان بريد إلكتروني خاص لإعادة التوجيه (relay). لا يجمع التطبيق بيانات الموقع الجغرافي (GPS).

**معلومات حساب VIP**

إذا اشتركت في خطة (VIP)، فسيتم إدارة الوصول عبر مفاتيح تفعيل معتمدة ومؤكدة. لا يجمع التطبيق أو يخزن تفاصيل بطاقة الدفع أو الحساب المصرفي الخاص بك.

**حذف الحساب وإدارة البيانات**

يحق للمستخدمين طلب حذف حساباتهم وجميع البيانات المرتبطة بها في أي وقت:
1. من داخل التطبيق: الانتقال إلى الإعدادات > الضغط على "حذف الحساب والبيانات" لإزالة الحساب نهائياً وفورياً.
2. عبر البريد الإلكتروني: يمكنك إرسال طلب حذف الحساب إلى muminrtx@gmail.com من بريدك الإلكتروني المسجل.

**وصول أطراف خارجية**

تتم ممارسة نقل البيانات التجميعية والجهولة فقط بشكل دوري إلى الخدمات الخارجية للمساعدة في تحسين التطبيق. نحن لا نبيع بياناتك الشخصية لأطراف خارجية.

**الاحتفاظ بالبيانات**

يتم الاحتفاظ ببيانات حساب المستخدم طوال فترة استخدامك للتطبيق بالإضافة إلى 12 شهرًا بعد ذلك، ما لم يتطلب القانون فترة أطول.

**الأطفال**

التطبيق غير موجه للأطفال دون سن 16 عامًا. نحن لا نجمع بيانات من الأطفال عن علم.

**الأمان**

نوفر ضمانات مادية وإلكترونية وإجرائية لحماية المعلومات التي نعالجها ونحافظ عليها.

**التغييرات**

قد نحدث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بالتغييرات الجوهرية عن طريق نشر السياسة المحدثة بتاريخ سريان.

**اتصل بنا**

إذا كانت لديك أي أسئلة حول الخصوصية، يرجى الاتصال بنا على البريد الإلكتروني:
muminrtx@gmail.com

تاريخ السريان: 2026-08-09`,

  english: `**Privacy Policy**

This privacy policy applies to the Iskan Nrxakan app for mobile devices, together with any related services operated by Mumin (collectively, the "Application").

**Information We Collect**

When you use the Application, we may collect:
• Your device's Internet Protocol (IP) address
• Pages visited within the Application, date and time of visit
• Time spent on the Application
• Your mobile operating system

**Authentication and Account Information**

The Application uses Google Sign-In and Sign in with Apple to authenticate users. When you sign in with either provider, we receive your email address and a provider-specific account identifier to create and manage your account. With Sign in with Apple, you may choose to hide your email address; Apple may then provide a private relay email address. The Application does not collect GPS location data.

**VIP Account Information**

If you activate the VIP plan, access is managed through verified activation keys. The Application does not collect or store your payment card or bank details.

**Account Deletion and Data Management**

Users have the right to request deletion of their account and associated data at any time:
1. In-App: Go to Settings > tap "Delete Account & Data" to immediately and permanently remove your account, session, and associated records.
2. Email Request: You may submit an account and data deletion request by emailing muminrtx@gmail.com with your registered email address.

**Third Party Access**

Only aggregated, anonymized data is periodically transmitted to external services to aid in improving the Application. We do not sell your personal data to third parties.

**Data Retention**

User account data is retained for the duration of your use of the Application plus 12 months, unless longer retention is required by law.

**Children**

The Application is not intended for children under 16 years of age. We do not knowingly collect data from children.

**Security**

We provide physical, electronic, and procedural safeguards to protect information we process and maintain.

**Changes**

We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy with an effective date.

**Contact Us**

If you have any questions regarding privacy, please contact us at:
muminrtx@gmail.com

Effective as of 2026-08-09`,
};

const TERMS_CONTENT: Record<Language, string> = {
  kurdish: `**مەرج و شوێنکەوتەکان**

ئەم مەرج و شوێنکەوتانە بۆ ئەپڵیکەیشنی (ئیسکان نرخەکان) لەسەر ئامێرە مۆبایلەکان جێبەجێ دەبن کە لەلایەن (مۆمین) بەڕێوەدەبرێت.

بە دابەزاندن یان بەکارهێنانی ئەپڵیکەیشنی، تۆ ڕەزامەندی دەدەیت لەسەر ئەم مەرج و شوێنکەوتانە.

**مۆڵەت**

دابینکەری خزمەتگوزاری مۆڵەتێکی سنووردار، نا-تایبەت، نا-گوێزراوە، و پاشگەزبووەوەت پێدەبەخشێت بۆ دامەزراندن و بەکارهێنانی ئەپڵیکەیشنەکە لەسەر ئامێری مۆبایل بۆ مەبەستی کەسی یان بازرگانی ناوخۆیی. تۆ مافی ئەوەت نییە ئەپڵیکەیشنەکە کۆپی بکەیت، بڵاوی بکەیتەوە، دەستکاری بکەیت، یان بەرنامەسازی پێچەوانەی بۆ بکەیت.

**مافی موڵکایەتی بیرۆکەیی**

دابینکەری خزمەتگوزاری سەرجەم مافەکانی موڵکایەتی بیرۆکەیی لە ئەپڵیکەیشنەکەدا دەپارێزێت، لەوانەش کۆدەکەی، دیزاین، نیشانە بازرگانییەکان، و براندەکەی. هیچ شتێک لەم مەرجانەدا مافی بەکارهێنانی نیشانە بازرگانییەکان یان لۆگۆکانی دابینکەری خزمەتگوزاریت پێنابەخشێت.

**بەشداری و چالاککردنی VIP**

ئەپڵیکەیشنەکە پلانی بەشداری (VIP) دابین دەکات کە لە ڕێگەی کۆدی ناسێنەری چالاککردن پشتڕاست دەکرێتەوە. مەرجەکانی بەشداری و سیاسەتەکان لەناو ئەپڵیکەیشنەکەدا ڕوونکراونەتەوە.

**سنووردارکردنی بەرپرسیارێتی**

تا ئەو پەڕەی یاسا ڕێگەی پێدەدات، دابینکەری خزمەتگوزاری بەرپسیار ناباتە ئەستۆ بەرامبەر هەر زیانێکی ناڕاستەوخۆ، ڕێکەوت، یان دەرئەنجامی، لەوانەش لەدەستدانی قازانج، لەدەستدانی زانیاری، یان وەستانی کار.

دابینکەری خزمەتگوزاری هیچ بەرپرسیارێتییەک لە ئەستۆ ناگرێت بەرامبەر ناڕاستی لە زانیارییەکانی نرخی دراوەکانی لایەنی سێیەم کە لە ڕێگەی ئەم ئەپڵیکەیشنەوە نیشان دەدرێن.

**کۆتایی پێهێنان**

دابینکەری خزمەتگوزاری دەتوانێت دەستگەیشتنت بۆ ئەپڵیکەیشنەکە ڕابگرێت یان کۆتایی پێبهێنێت ئەگەر بە شێوەیەکی مادی ئەم مەرجانە پێشێل بکەیت.

**یاسای کارپێکراو**

ئەم مەرج و شوێنکەوتانە بەپێی یاساکانی ئەو دەسەڵاتە بەڕێوەدەبرێن کە دابینکەری خزمەتگوزاری تێیدا دامەزراوە.

**گۆڕانکارییەکان**

دابینکەری خزمەتگوزاری دەتوانێت ناوبەناو ئەم مەرجانە نوێ بکاتەوە. پێشنیارت بۆ دەکرێت کە بە بەردەوامی سەردانی ئەم لاپەڕەیە بکەیت بۆ هەر گۆڕانکارییەک.

**پەیوەندیکردن بە ئێمە**

ئەگەر هەر پرسیارێکت هەبوو سەبارەت بەم مەرج و شوێنکەوتانە، تکایە پەیوەندیمان پێوە بکە لە ڕێگەی ئیمەیڵی:
muminrtx@gmail.com

بەرواری کارپێکردن: ٢٠٢٦-٠٨-٠٩`,

  arabic: `**الشروط والأحكام**

تنطبق هذه الشروط والأحكام على تطبيق (إسكان نرخەكان) للأجهزة المحمولة الذي يديره مؤمن.

بتنزيل التطبيق أو استخدامه، فإنك توافق على هذه الشروط والأحكام.

**الترخيص**

يمنحك مقدم الخدمة ترخيصًا محدودًا وغير حصري وغير قابل للنقل وقابلاً للإلغاء لتثبيت التطبيق واستخدامه على جهاز محمول لأغراض شخصية أو تجارية داخلية. لا يجوز لك إعادة إنتاج التطبيق أو توزيعه أو تعديله أو هندسته عكسياً.

**الملكية الفكرية**

يحتفظ مقدم الخدمة بجميع حقوق الملكية الفكرية في التطبيق، بما في ذلك الكود والتصميم والعلامات التجارية والهوية التجارية. لا شيء في هذه الشروط يمنحك أي حق في استخدام العلامات التجارية أو الشعارات الخاصة بمقدم الخدمة.

**الاشتراك وتفعيل VIP**

يقدم التطبيق خطة (VIP) يتم تفعيلها عبر مفاتيح الحساب المعتمدة. يتم توضيح شروط الاشتراك وسياسات الوصول داخل التطبيق.

**حدود المسؤولية**

إلى أقصى حد يسمح به القانون، لا يكون مقدم الخدمة مسؤولاً عن أي أضرار غير مباشرة أو عرضية أو تبعية، بما في ذلك على سبيل المثال لا الحصر خسارة الأرباح أو فقدان البيانات أو توقف الأعمال.

لا يتحمل مقدم الخدمة أي مسؤولية عن عدم الدقة في بيانات أسعار الصرف الخاصة بأطراف خارجية والمطبوعة عبر هذا التطبيق.

**الإنهاء**

يجوز لمقدم الخدمة تعليق أو إنهاء وصولك إلى التطبيق إذا انتهكت هذه الشروط بشكل مادي.

**القانون الساري**

تخضع هذه الشروط والأحكام لقوانين الولاية القضائية التي تم تأسيس مقدم الخدمة فيها.

**التغييرات**

قد يحدث مقدم الخدمة هذه الشروط بشكل دوري. يُنصح بمراجعة هذه الصفحة بانتظام لمعرفة أي تغييرات.

**اتصل بنا**

إذا كانت لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا على البريد الإلكتروني:
muminrtx@gmail.com

تاريخ السريان: 2026-08-09`,

  english: `**Terms & Conditions**

These terms and conditions apply to the Iskan Nrxakan app for mobile devices operated by Mumin.

By downloading or using the Application, you agree to these Terms and Conditions.

**License**

The Service Provider grants you a limited, non-exclusive, non-transferable, revocable license to install and use the Application on a mobile device for personal or internal business purposes. You may not reproduce, distribute, modify, reverse engineer, or decompile the Application.

**Intellectual Property**

The Service Provider retains all intellectual property rights in the Application, including its code, design, trademarks, and branding. Nothing in these Terms grants you any right to use the Service Provider's trademarks or logos.

**VIP Access & Terms**

The Application offers a VIP access plan activated via verified account keys. Terms, features, and policies are communicated within the Application.

**Limitation of Liability**

To the fullest extent permitted by law, the Service Provider shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to lost profits, data loss, or business interruption.

The Service Provider accepts no liability for inaccuracies in third-party exchange rate data displayed through this Application.

**Termination**

The Service Provider may suspend or terminate your access to the Application if you materially breach these Terms.

**Governing Law**

These Terms and Conditions are governed by the laws of the jurisdiction in which the Service Provider is established.

**Changes**

The Service Provider may periodically update these Terms. You are advised to review this page regularly for any changes.

**Contact Us**

If you have any questions about these Terms and Conditions, please contact us at:
muminrtx@gmail.com
Effective as of 2026-08-09`,
};

// ─── Sub-modal component for displaying policy text ──────────────────────────

function PolicyModal({
  visible,
  title,
  content,
  closeLabel,
  onClose,
}: {
  visible: boolean;
  title: string;
  content: string;
  closeLabel: string;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={policyStyles.overlay}>
      <View style={policyStyles.card}>
          {/* Header */}
          <View style={policyStyles.header}>
            <Pressable
              hitSlop={12}
              onPress={onClose}
              style={({ pressed }) => [policyStyles.closeBtn, pressed && policyStyles.pressed]}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
            <Text style={policyStyles.title}>{title}</Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={policyStyles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={policyStyles.scrollContent}
          >
            {content.split('\n\n').map((block, i) => {
              const isBold = block.startsWith('**') && block.includes('**');
              const cleanText = block.replace(/\*\*/g, '');
              return (
                <Text
                  key={i}
                  style={[
                    policyStyles.bodyText,
                    isBold && block.split('\n')[0].startsWith('**')
                      ? policyStyles.heading
                      : null,
                  ]}
                >
                  {cleanText}
                </Text>
              );
            })}
          </ScrollView>

          {/* Close button — uses translated label */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [policyStyles.closeFooterBtn, pressed && policyStyles.pressed]}
          >
            <Text style={policyStyles.closeFooterText}>{closeLabel}</Text>
          </Pressable>
      </View>
    </View>
  );
}

// ─── Real Confirmation-by-Typing Delete Account Modal ─────────────────────────

function DeleteAccountModal({
  visible,
  language,
  userEmail,
  onClose,
  onConfirmDelete,
  isDeleting,
}: {
  visible: boolean;
  language: Language;
  userEmail?: string | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  if (!visible) return null;

  const targetWord = 'DELETE';
  const isMatch = confirmText.trim().toUpperCase() === targetWord;

  const isEn = language === 'english';
  const isAr = language === 'arabic';

  const title = isEn ? 'Delete Account & Data' : isAr ? 'حذف الحساب والبيانات' : 'سڕینەوەی هەژمار و زانیاری';
  const warningText = isEn
    ? 'Warning: This action is permanent and cannot be undone. All your settings, subscriptions, and records will be deleted immediately.'
    : isAr
    ? 'تحذير: هذا الإجراء دائم ولا يمكن التراجع عنه. سيتم حذف جميع إعداداتك واشتراكاتك وسجلاتك نهائياً.'
    : 'ئاگاداری: ئەم کردارە هەمیشەییە و ناگەڕێندرێتەوە. سەرجەم ڕێکخستنەکان، بەشدارییەکان، و تۆمارەکانت بە یەکجاری دەسڕدرێنەوە.';

  const promptText = isEn
    ? `To confirm, please type "${targetWord}" below:`
    : isAr
    ? `للتأكيد، يرجى كتابة كلمة "${targetWord}" أدناه:`
    : `بۆ دڵنیابوونەوە، تکایە وشەی "${targetWord}" لە خوارەوە بنووسە:`;

  const btnDelete = isEn ? 'Permanently Delete' : isAr ? 'حذف الحساب نهائياً' : 'سڕینەوەی هەمیشەیی';
  const btnCancel = isEn ? 'Cancel' : isAr ? 'إلغاء' : 'پاشگەزبوونەوە';

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <View style={deleteStyles.overlay}>
      <View style={deleteStyles.card}>
          {/* Warning Icon Badge */}
          <View style={deleteStyles.iconBadge}>
            <Ionicons name="warning-outline" size={32} color="#DC2626" />
          </View>

          <Text style={deleteStyles.title}>{title}</Text>
          
          {userEmail ? (
            <View style={deleteStyles.emailBadge}>
              <Ionicons name="person-circle-outline" size={16} color="#64748B" />
              <Text style={deleteStyles.emailText}>{userEmail}</Text>
            </View>
          ) : null}

          <Text style={deleteStyles.warningText}>{warningText}</Text>

          {/* Typing Prompt */}
          <Text style={deleteStyles.promptText}>{promptText}</Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={targetWord}
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
            style={deleteStyles.input}
          />

          {/* Action Buttons */}
          <View style={deleteStyles.actionsRow}>
            <Pressable
              onPress={handleClose}
              disabled={isDeleting}
              style={({ pressed }) => [deleteStyles.cancelBtn, pressed && deleteStyles.pressed]}
            >
              <Text style={deleteStyles.cancelBtnText}>{btnCancel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirmDelete}
              disabled={!isMatch || isDeleting}
              style={({ pressed }) => [
                deleteStyles.confirmDeleteBtn,
                !isMatch && deleteStyles.confirmDeleteDisabled,
                pressed && isMatch && deleteStyles.pressed,
              ]}
            >
              <Text style={deleteStyles.confirmDeleteText}>
                {isDeleting ? (isEn ? 'Deleting...' : isAr ? 'جاري الحذف...' : 'لە سڕینەوەدایە...') : btnDelete}
              </Text>
            </Pressable>
          </View>
      </View>
    </View>
  );
}

// ─── Main Settings Modal ──────────────────────────────────────────────────────

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (visible) {
      checkNotificationPermission().then((granted) => {
        setNotificationsEnabled(granted);
      });
      supabase.auth.getUser().then(({ data }) => {
        const user = data?.user;
        setIsLoggedIn(!!user);
        setCurrentUserEmail(user?.email || null);
      });
    }
  }, [visible]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    }
  };

  const handleDeleteBtnPress = () => {
    if (!isLoggedIn) {
      const isEn = language === 'english';
      const isAr = language === 'arabic';
      Alert.alert(
        isEn ? 'Not Signed In' : isAr ? 'لم يتم تسجيل الدخول' : 'نەچوویتەتە ژوورەوە',
        isEn
          ? 'You are not signed in. Only registered accounts can be deleted.'
          : isAr
          ? 'أنت لست مسجلاً. يمكن فقط حذف الحسابات المسجلة.'
          : 'تۆ نەچوویتەتە ژوورەوە بە هیچ هەژمارێک. تەنها هەژمارە تۆمارکراوەکان دەسڕدرێنەوە.'
      );
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const targetEmail = currentUserEmail ? currentUserEmail.trim().toLowerCase() : null;

    try {
      // 1. Call server-side SECURITY DEFINER RPC to safely record in deleted_accounts,
      // delete user, and nullify foreign keys
      const { data, error } = await supabase.rpc('delete_user_account');
      if (error) {
        console.warn('delete_user_account RPC response:', error);
      }
    } catch (err) {
      console.log('Account delete cleanup:', err);
    }

    // 2. Extra client safeguard to ensure email is permanently marked in deleted_accounts
    if (targetEmail) {
      try {
        await supabase.from('deleted_accounts').upsert({ email: targetEmail });
        await supabase.from('payment_requests').delete().eq('email', targetEmail);
        await supabase.from('user_subscriptions').delete().eq('email', targetEmail);
      } catch (err) {
        console.log('Client delete cleanup:', err);
      }
    }

    // 3. Clear session and sign out
    await supabase.auth.signOut();
    setIsDeleting(false);
    setShowDeleteModal(false);
    setIsLoggedIn(false);
    setCurrentUserEmail(null);
    onClose();

    const isEn = language === 'english';
    const isAr = language === 'arabic';
    Alert.alert(
      isEn ? 'Account Deleted' : isAr ? 'تم حذف الحساب' : 'هەژمار سڕایەوە',
      isEn
        ? 'Your account has been permanently deleted. You cannot sign in with this email again.'
        : isAr
        ? 'تم حذف حسابك نهائياً. لا يمكنك تسجيل الدخول بهذا البريد الإلكتروني مرة أخرى.'
        : 'هەژمارەکەت بە یەکجاری سڕایەوە. چیتر ناتوانیت بەم ئیمەیڵە بچیتە ژوورەوە.'
    );
  };

  const handleModalRequestClose = () => {
    if (showPrivacy) {
      setShowPrivacy(false);
    } else if (showTerms) {
      setShowTerms(false);
    } else if (showDeleteModal) {
      setShowDeleteModal(false);
    } else {
      onClose();
    }
  };

  return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={handleModalRequestClose}>
        {showPrivacy ? (
          <PolicyModal
            visible
            title={t('privacyPolicyBtn')}
            content={PRIVACY_POLICY_CONTENT[language] || PRIVACY_POLICY_CONTENT.kurdish}
            closeLabel={t('closeBtn')}
            onClose={() => setShowPrivacy(false)}
          />
        ) : showTerms ? (
          <PolicyModal
            visible
            title={t('termsConditionsBtn')}
            content={TERMS_CONTENT[language] || TERMS_CONTENT.kurdish}
            closeLabel={t('closeBtn')}
            onClose={() => setShowTerms(false)}
          />
        ) : showDeleteModal ? (
          <DeleteAccountModal
            visible
            language={language}
            userEmail={currentUserEmail}
            isDeleting={isDeleting}
            onClose={() => setShowDeleteModal(false)}
            onConfirmDelete={handleConfirmDelete}
          />
        ) : (
        <View style={styles.modalOverlay}>
          {/* Backdrop — tap anywhere above the card to close */}
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={styles.modalCard}>
            {/* Header Bar */}
            <View style={styles.headerRow}>
              <Pressable hitSlop={12} onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
              <Text style={styles.modalTitle}>{t('settingsTitle')}</Text>
            </View>

            {/* Language Selector */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>{t('languageLabel')}</Text>
              <View style={styles.optionsGroup}>
                <Pressable
                  onPress={() => setLanguage('kurdish')}
                  style={[styles.optionPill, language === 'kurdish' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'kurdish' && styles.optionTextActive]}>
                    {t('kurdish')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLanguage('arabic')}
                  style={[styles.optionPill, language === 'arabic' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'arabic' && styles.optionTextActive]}>
                    {t('arabic')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setLanguage('english')}
                  style={[styles.optionPill, language === 'english' && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, language === 'english' && styles.optionTextActive]}>
                    {t('english')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Notifications Toggle */}
            <View style={styles.toggleRow}>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#CBD5E1', true: '#3B50C8' }}
                thumbColor="#FFFFFF"
              />
              <View style={styles.toggleMeta}>
                <Text style={styles.toggleTitle}>{t('notificationsTitle')}</Text>
                <Text style={styles.toggleSub}>{t('notificationsSub')}</Text>
              </View>
            </View>

            {/* ─── Legal Section ─── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>{t('legalLabel')}</Text>

              {/* Privacy Policy Button */}
              <Pressable
                onPress={() => setShowPrivacy(true)}
                style={({ pressed }) => [styles.legalBtn, pressed && styles.pressed]}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#3B50C8" />
                <Text style={styles.legalBtnText}>{t('privacyPolicyBtn')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </Pressable>

              {/* Terms & Conditions Button */}
              <Pressable
                onPress={() => setShowTerms(true)}
                style={({ pressed }) => [styles.legalBtn, pressed && styles.pressed]}
              >
                <Ionicons name="document-text-outline" size={18} color="#3B50C8" />
                <Text style={styles.legalBtnText}>{t('termsConditionsBtn')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </Pressable>
            </View>

            {/* ─── Account Deletion (Google Play Compliance) ─── */}
            <Pressable
              onPress={handleDeleteBtnPress}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteBtnText}>
                {language === 'english' ? 'Delete Account & Data' : language === 'arabic' ? 'حذف الحساب والبيانات' : 'سڕینەوەی هەژمار و زانیاری'}
              </Text>
            </Pressable>

            {/* Done Button */}
            <Pressable onPress={onClose} style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}>
              <Text style={styles.doneBtnText}>{t('doneBtn')}</Text>
            </Pressable>
          </View>
        </View>
        )}
      </Modal>
  );
}

// ─── Settings Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  optionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  optionPillActive: {
    backgroundColor: '#3B50C8',
    borderColor: '#3B50C8',
  },
  optionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleMeta: {
    alignItems: 'flex-end',
    flex: 1,
  },
  toggleTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  legalBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  doneBtn: {
    backgroundColor: '#3B50C8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});

// ─── Policy Modal Styles ──────────────────────────────────────────────────────

const policyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  heading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  bodyText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'right',
  },
  closeFooterBtn: {
    backgroundColor: '#3B50C8',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeFooterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});

// ─── Delete Modal Styles ──────────────────────────────────────────────────────

const deleteStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 2,
  },
  emailText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  warningText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  promptText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1.3,
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6,
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
