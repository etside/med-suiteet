<?php
/**
 * Seed sample medicines into the products table
 * Usage: php public/api/seed-products.php
 */

require __DIR__ . '/inc/helpers.php';

$config = require __DIR__ . '/config.php';
$dsn = "mysql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']};charset=utf8mb4";
$pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$medicines = [
    [
        'name' => 'Napa Extra',
        'name_bn' => 'নাপা এক্সট্রা',
        'generic_name' => 'Paracetamol 500mg',
        'category' => 'analgesic',
        'price' => 12.00,
        'stock' => 250,
        'min_stock' => 50,
        'batch_number' => 'NAPA-2026-001',
        'expiry_date' => '2026-12-31',
        'requires_prescription' => 0,
        'description' => 'Pain relief and fever reducer tablet',
        'description_bn' => 'ব্যথা ও জ্বর কমানোর ট্যাবলেট',
    ],
    [
        'name' => 'Aspirin 325mg',
        'name_bn' => 'এস্পিরিন ৩২৫ মিগ্রা',
        'generic_name' => 'Acetylsalicylic Acid',
        'category' => 'analgesic',
        'price' => 8.50,
        'stock' => 300,
        'min_stock' => 50,
        'batch_number' => 'ASPIRIN-2026-001',
        'expiry_date' => '2026-12-15',
        'requires_prescription' => 0,
        'description' => 'Antiplatelet and pain reliever',
        'description_bn' => 'প্ল্যাটলেট বাধা এবং ব্যথা উপশমকারী',
    ],
    [
        'name' => 'Amoxicillin 500mg',
        'name_bn' => 'অ্যামোক্সিসিলিন ৫০০ মিগ্রা',
        'generic_name' => 'Amoxicillin',
        'category' => 'antibiotic',
        'price' => 45.00,
        'stock' => 150,
        'min_stock' => 30,
        'batch_number' => 'AMOX-2026-001',
        'expiry_date' => '2026-11-30',
        'requires_prescription' => 1,
        'description' => 'Broad-spectrum antibiotic',
        'description_bn' => 'ব্যাপক-বর্ণালী অ্যান্টিবায়োটিক',
    ],
    [
        'name' => 'Lisinopril 10mg',
        'name_bn' => 'লিসিনোপ্রিল ১০ মিগ্রা',
        'generic_name' => 'Lisinopril',
        'category' => 'antihypertensive',
        'price' => 35.00,
        'stock' => 100,
        'min_stock' => 30,
        'batch_number' => 'LISIN-2026-001',
        'expiry_date' => '2026-10-31',
        'requires_prescription' => 1,
        'description' => 'ACE inhibitor for blood pressure',
        'description_bn' => 'উচ্চ রক্তচাপের জন্য এসিই ইনহিবিটর',
    ],
    [
        'name' => 'Metformin 500mg',
        'name_bn' => 'মেটফোর্মিন ৫০০ মিগ্রা',
        'generic_name' => 'Metformin HCl',
        'category' => 'antidiabetic',
        'price' => 28.00,
        'stock' => 200,
        'min_stock' => 50,
        'batch_number' => 'METF-2026-001',
        'expiry_date' => '2026-12-31',
        'requires_prescription' => 1,
        'description' => 'Diabetes management medication',
        'description_bn' => 'ডায়াবেটিস ব্যবস্থাপনার ওষুধ',
    ],
    [
        'name' => 'Cetirizine 10mg',
        'name_bn' => 'সেটিরাজিন ১০ মিগ্রা',
        'generic_name' => 'Cetirizine HCl',
        'category' => 'antihistamine',
        'price' => 15.00,
        'stock' => 400,
        'min_stock' => 100,
        'batch_number' => 'CETI-2026-001',
        'expiry_date' => '2026-11-30',
        'requires_prescription' => 0,
        'description' => 'Allergy relief medication',
        'description_bn' => 'অ্যালার্জি প্রশমনের ওষুধ',
    ],
    [
        'name' => 'Omeprazole 20mg',
        'name_bn' => 'অমেপ্রাজোল ২০ মিগ্রা',
        'generic_name' => 'Omeprazole',
        'category' => 'gastrointestinal',
        'price' => 32.00,
        'stock' => 180,
        'min_stock' => 30,
        'batch_number' => 'OMEP-2026-001',
        'expiry_date' => '2026-10-15',
        'requires_prescription' => 1,
        'description' => 'Acid reflux and ulcer treatment',
        'description_bn' => 'এসিড রিফ্লাক্স এবং আলসার চিকিত্সা',
    ],
    [
        'name' => 'Vitamin B Complex',
        'name_bn' => 'ভিটামিন বি কমপ্লেক্স',
        'generic_name' => 'B1+B2+B3+B5+B6+B12',
        'category' => 'vitamin',
        'price' => 22.00,
        'stock' => 300,
        'min_stock' => 50,
        'batch_number' => 'VITB-2026-001',
        'expiry_date' => '2026-12-31',
        'requires_prescription' => 0,
        'description' => 'Energy and nerve function support',
        'description_bn' => 'শক্তি এবং স্নায়ু কার্যকরিতা সমর্থন',
    ],
];

$count = 0;
foreach ($medicines as $med) {
    $stmt = $pdo->prepare(
        'INSERT INTO products (id, name, name_bn, generic_name, category, price, stock, min_stock, batch_number, expiry_date, requires_prescription, description, description_bn)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        uuid(),
        $med['name'],
        $med['name_bn'],
        $med['generic_name'],
        $med['category'],
        $med['price'],
        $med['stock'],
        $med['min_stock'],
        $med['batch_number'],
        $med['expiry_date'],
        $med['requires_prescription'],
        $med['description'],
        $med['description_bn'],
    ]);
    $count++;
}

echo "✓ Seeded $count sample medicines\n";
