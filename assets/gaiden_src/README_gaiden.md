# ROCKSIDE外伝（屋敷探索・主人公カナタ）用スプライト

共通：透過PNG、横一列、右向き（chronoa_clock は正面）、アンチエイリアスなし（アルファは0か255のみ）。各フレームの下端が足元。座標は右向きフレーム内のピクセル座標で、左向きでは x → (幅-1-x)。

## 縮尺（カナタに合わせた）
- 外伝のゲーム本体は /workspace/kanata-gaiden。カナタは assets/kanata.png（1フレーム 106×70、足元 anchorX 46 / anchorY 69、待機の高さ 68px。tools/cut_hero.py の TARGET_H=68）。/workspace/rockside-pages には外伝のコードは無い。
- 新しいキャラはこのカナタと同じ縮尺（拡大縮小なしで並べる）。頭の大きさをカナタに合わせ、あご〜足だけ縦 0.68 に縮めて、カナタと同じ大きな頭・短い体の比率にした。全身の高さ：カナタ 69px / クロノア 71px（フード込み）/ ヴェル 73px。
- 並べるときは足元の点（下の cx, y=79）をカナタの (46,69) と同じ床の点に合わせる。確認: work/gaiden/gaiden_scale_check.png

## chronoa.png（時計塔管理人クロノア・真の最終ボス）128×80 × 10
- 0 待機（背後に時計の目）/ 1 移動（歩き）/ 2 懐中時計の振り子攻撃 / 3 時止め（手を上げる＋金の紋章）/ 4 目のビーム（クロノア＋右に浮かぶ時計のミミックが撃つ）/ 5 被弾 / 6 撃破（うつ伏せ・ひびの入った時計）/ 7 見えない何かに持ち上げられて浮く
- 追加: 8 待機のまばたき（idle は 0,0,0,8）/ 9 歩きの揺れ（1 の上半身を1px上げた簡易版。move は 1,9）
- 体の中心 x=64（cx 64、全フレーム共通）、足元 y=79。浮遊7だけ足が y=74。共通スケール 0.32。32色。
- 発生点（chronoa.json の spawn）: 懐中時計 watch = 2 の (111,61)（鎖を持つ手 watchHand (90,48)）/ 紋章の中心 glyph = 3 の (108,41)（上げた手 palm (96,41)）/ ビーム beam = 4 の (121,35)（時計の目 clockEye (102,35)）/ 待機の時計の目 clockEyeIdle = 0 の (26,44) / 撃破の時計 crackedClock = 6 の (98,64)。左向きでは x → 127-x。
- 紋章は原画だと半径約30pxで枠に入らないので、半径9pxの金のリング（目盛り・針・きらめき）を手の後ろに描き直した。大きな演出はゲーム側で glyph を中心に。
- ビームは目から枠の右端まで短く描いただけ。本体はゲーム側で beam から右へ（太さ約3px）。
- 目はティールが縮小で消えるので手で打った（まつ毛1行＋2x2の虹彩）。

## chronoa_clock.png（時計のミミックだけ）48×48 × 4
- 0 目を開く / 1 半目（まばたき）/ 2 にらんで溜める（緑の光）/ 3 ひび割れ（撃破）。目の中心 eye = (23,26)（0〜2）。スケール 0.128。24色。

## vel.png（主人の秘書ヴェル・戦わないNPC）64×80 × 7
- 0 待機 / 1 まばたき / 2 歩き / 3 歩きの揺れ（2 の上半身を1px上げた簡易版）/ 4 おじぎ / 5 肩越しに振り返る / 6 後ろ姿で去る
- 体の中心 x=32（cx 32）、足元 y=79。共通スケール 0.28。26色。人の姿のみ（触手なし）。
- 原画 vel_raw2.jpg は両目が見えていたので、向かって左の目を髪の房で隠すように原画に描き足してから縮小した（vel_raw1.jpg の髪型）。見えている目（灰色）は手で打った。位置は vel.json の eyes。
- vel_portrait.png（64×64）: 会話用のバストアップ。下端は胸で切れている。外伝の chars.json の portrait_vel は 48×48 なので、その枠に入れるなら 0.75 倍で描くか枠を 64 に。

## 顔アイコン（24×24）
- chronoa_face.png（茶色の髪・フード・ティールの目）、vel_face.png（黒髪で片目が隠れる・灰色の目）

## プレビュー・生成
- プレビュー: work/gaiden/chronoa_preview.png、work/gaiden/vel_preview.png（4倍・発生点・重ね合わせ・明るい背景）、work/gaiden/gaiden_scale_check.png（カナタ・クロノア・ヴェルと旧仮素材を同じ縮尺で並べたもの）
- 生成: work/gaiden/gaiden_sheet.py（レイヤー合成・あご下の縦圧縮・緑の目を残す抜き・原画への描き足し）＋ chronoa_spec.json / chronoa_clock_spec.json / vel_spec.json / vel_portrait_spec.json（vel の2つは vel_spec_gen.py が書く）→ chronoa_post.py / chronoa_clock_post.py / vel_post.py。顔: gaiden_faces.py。プレビュー: make_gaiden_previews.py
